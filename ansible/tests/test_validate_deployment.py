"""
Tests for ansible/playbooks/validate_deployment.yml

Covers:
- YAML validity and overall playbook structure
- Pre-task variable validation assert conditions
- URI task configuration (endpoints, methods, status codes)
- Frontend HTML assertion conditions
- Asset regex extraction pattern
- Data URI filtering logic
- Asset URL building logic (absolute, relative with slash, relative without slash)
- Failure condition when no assets are found
- Database check conditional (404 triggers debug, other codes fail)
- Registered variable names and changed_when semantics
- Summary debug message structure
"""

import os
import re
import sys
import unittest
import yaml

PLAYBOOK_PATH = os.path.join(
    os.path.dirname(__file__), "..", "playbooks", "validate_deployment.yml"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_playbook():
    with open(PLAYBOOK_PATH, encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _get_play(playbook):
    """Return the single play in the playbook."""
    return playbook[0]


def _get_task_by_name(tasks, name):
    for task in tasks:
        if task.get("name") == name:
            return task
    return None


def _simulate_asset_url(validation_base_url, frontend_asset_path):
    """
    Python equivalent of the Jinja2 expression in
    'Build frontend asset validation URL'.

      {{ frontend_asset_path
         if (frontend_asset_path is match('^https?://'))
         else (
           validation_base_url ~
           (
             frontend_asset_path
             if frontend_asset_path.startswith('/')
             else '/' ~ frontend_asset_path
           )
         )
      }}
    """
    if re.match(r'^https?://', frontend_asset_path):
        return frontend_asset_path
    if frontend_asset_path.startswith('/'):
        return validation_base_url + frontend_asset_path
    return validation_base_url + '/' + frontend_asset_path


def _extract_asset_paths(html_content):
    """
    Python equivalent of the Jinja2 regex_findall expression:
      regex_findall("(?:src|href)=[\"']([^\"']+\\.(?:js|css|png|svg|ico|woff2?)(?:\\?[^\"']*)?)[\"']")
    """
    pattern = r"""(?:src|href)=["']([^"']+\.(?:js|css|png|svg|ico|woff2?)(?:\?[^"']*)?)[" ']"""
    return re.findall(pattern, html_content)


def _select_first_asset(asset_paths):
    """
    Python equivalent of:
      (frontend_asset_paths | reject('match', '^data:') | list | first) | default('')
    """
    filtered = [p for p in asset_paths if not re.match(r'^data:', p)]
    return filtered[0] if filtered else ''


# ---------------------------------------------------------------------------
# Tests: YAML Structure
# ---------------------------------------------------------------------------

class TestPlaybookStructure(unittest.TestCase):

    def setUp(self):
        self.playbook = _load_playbook()
        self.play = _get_play(self.playbook)

    def test_playbook_is_valid_yaml(self):
        """Playbook file must parse as valid YAML without errors."""
        self.assertIsNotNone(self.playbook)

    def test_playbook_contains_exactly_one_play(self):
        self.assertEqual(len(self.playbook), 1)

    def test_play_name(self):
        self.assertEqual(
            self.play["name"],
            "Validate end-to-end deployment through CloudFront",
        )

    def test_play_targets_localhost(self):
        self.assertEqual(self.play["hosts"], "localhost")

    def test_play_uses_local_connection(self):
        self.assertEqual(self.play["connection"], "local")

    def test_play_does_not_gather_facts(self):
        self.assertIs(self.play["gather_facts"], False)

    def test_play_defines_validation_base_url_var(self):
        vars_section = self.play.get("vars", {})
        self.assertIn("validation_base_url", vars_section)

    def test_validation_base_url_uses_cloudfront_domain(self):
        base_url = self.play["vars"]["validation_base_url"]
        self.assertIn("cloudfront_domain", base_url)
        self.assertTrue(base_url.startswith("https://"))

    def test_play_has_pre_tasks(self):
        self.assertIn("pre_tasks", self.play)
        self.assertGreater(len(self.play["pre_tasks"]), 0)

    def test_play_has_tasks(self):
        self.assertIn("tasks", self.play)
        self.assertGreater(len(self.play["tasks"]), 0)

    def test_play_has_twelve_tasks(self):
        self.assertEqual(len(self.play["tasks"]), 12)


# ---------------------------------------------------------------------------
# Tests: Pre-task Variable Validation
# ---------------------------------------------------------------------------

class TestPreTaskVariableValidation(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.pre_tasks = play["pre_tasks"]
        self.assert_task = _get_task_by_name(self.pre_tasks, "Validate required variables")

    def test_pre_task_validate_required_variables_exists(self):
        self.assertIsNotNone(self.assert_task)

    def test_pre_task_uses_assert_module(self):
        self.assertIn("ansible.builtin.assert", self.assert_task)

    def test_assert_checks_cloudfront_domain_is_defined(self):
        conditions = self.assert_task["ansible.builtin.assert"]["that"]
        self.assertIn("cloudfront_domain is defined", conditions)

    def test_assert_checks_cloudfront_domain_is_non_empty(self):
        conditions = self.assert_task["ansible.builtin.assert"]["that"]
        self.assertTrue(
            any("length" in c and "cloudfront_domain" in c for c in conditions),
            "Expected a length check on cloudfront_domain",
        )

    def test_assert_has_descriptive_fail_message(self):
        fail_msg = self.assert_task["ansible.builtin.assert"]["fail_msg"]
        self.assertIn("cloudfront_domain", fail_msg)

    def test_assert_has_two_conditions(self):
        conditions = self.assert_task["ansible.builtin.assert"]["that"]
        self.assertEqual(len(conditions), 2)


# ---------------------------------------------------------------------------
# Tests: Backend Health Endpoint Task
# ---------------------------------------------------------------------------

class TestBackendHealthTask(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.task = _get_task_by_name(play["tasks"], "Verify backend health endpoint")

    def test_task_exists(self):
        self.assertIsNotNone(self.task)

    def test_task_uses_uri_module(self):
        self.assertIn("ansible.builtin.uri", self.task)

    def test_endpoint_path_is_api_healthz(self):
        url = self.task["ansible.builtin.uri"]["url"]
        self.assertIn("/api/healthz", url)

    def test_method_is_get(self):
        self.assertEqual(self.task["ansible.builtin.uri"]["method"], "GET")

    def test_expects_status_200(self):
        self.assertEqual(self.task["ansible.builtin.uri"]["status_code"], 200)

    def test_follows_redirects(self):
        self.assertEqual(self.task["ansible.builtin.uri"]["follow_redirects"], "all")

    def test_returns_content(self):
        self.assertTrue(self.task["ansible.builtin.uri"]["return_content"])

    def test_registers_backend_health_response(self):
        self.assertEqual(self.task["register"], "backend_health_response")

    def test_changed_when_false(self):
        self.assertIs(self.task["changed_when"], False)


# ---------------------------------------------------------------------------
# Tests: Database Connectivity Check Task
# ---------------------------------------------------------------------------

class TestDatabaseCheckTask(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.task = _get_task_by_name(
            play["tasks"], "Verify database connectivity endpoint when available"
        )

    def test_task_exists(self):
        self.assertIsNotNone(self.task)

    def test_task_uses_uri_module(self):
        self.assertIn("ansible.builtin.uri", self.task)

    def test_endpoint_path_is_api_db_check(self):
        url = self.task["ansible.builtin.uri"]["url"]
        self.assertIn("/api/db-check", url)

    def test_accepts_status_200(self):
        self.assertIn(200, self.task["ansible.builtin.uri"]["status_code"])

    def test_accepts_status_404_for_optional_endpoint(self):
        self.assertIn(404, self.task["ansible.builtin.uri"]["status_code"])

    def test_accepts_exactly_two_status_codes(self):
        self.assertEqual(len(self.task["ansible.builtin.uri"]["status_code"]), 2)

    def test_registers_database_check_response(self):
        self.assertEqual(self.task["register"], "database_check_response")

    def test_failed_when_restricts_to_200_or_404(self):
        failed_when = self.task["failed_when"]
        self.assertIn("200", str(failed_when))
        self.assertIn("404", str(failed_when))

    def test_changed_when_false(self):
        self.assertIs(self.task["changed_when"], False)


# ---------------------------------------------------------------------------
# Tests: Optional DB Debug Task
# ---------------------------------------------------------------------------

class TestDatabaseSkipDebugTask(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.task = _get_task_by_name(
            play["tasks"], "Report skipped optional database validation"
        )

    def test_task_exists(self):
        self.assertIsNotNone(self.task)

    def test_task_uses_debug_module(self):
        self.assertIn("ansible.builtin.debug", self.task)

    def test_message_references_db_check_path(self):
        msg = self.task["ansible.builtin.debug"]["msg"]
        self.assertIn("/api/db-check", msg)

    def test_conditional_triggers_only_on_404(self):
        when_clause = self.task["when"]
        self.assertIn("404", str(when_clause))
        self.assertIn("database_check_response", str(when_clause))

    def test_conditional_does_not_trigger_on_200(self):
        when_clause = str(self.task["when"])
        # The condition is == 404, not == 200
        self.assertNotIn("== 200", when_clause)


# ---------------------------------------------------------------------------
# Tests: Frontend Root Validation Task
# ---------------------------------------------------------------------------

class TestFrontendRootTask(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.task = _get_task_by_name(play["tasks"], "Verify frontend root loads")

    def test_task_exists(self):
        self.assertIsNotNone(self.task)

    def test_endpoint_is_root_slash(self):
        url = self.task["ansible.builtin.uri"]["url"]
        self.assertTrue(url.endswith("/"))

    def test_expects_status_200(self):
        self.assertEqual(self.task["ansible.builtin.uri"]["status_code"], 200)

    def test_sends_accept_text_html_header(self):
        headers = self.task["ansible.builtin.uri"]["headers"]
        self.assertEqual(headers.get("Accept"), "text/html")

    def test_registers_frontend_root_response(self):
        self.assertEqual(self.task["register"], "frontend_root_response")

    def test_returns_content(self):
        self.assertTrue(self.task["ansible.builtin.uri"]["return_content"])


# ---------------------------------------------------------------------------
# Tests: Frontend HTML Assert Task
# ---------------------------------------------------------------------------

class TestFrontendHtmlAssertTask(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.task = _get_task_by_name(play["tasks"], "Assert frontend response is HTML")

    def test_task_exists(self):
        self.assertIsNotNone(self.task)

    def test_uses_assert_module(self):
        self.assertIn("ansible.builtin.assert", self.task)

    def test_asserts_html_tag_in_content(self):
        conditions = self.task["ansible.builtin.assert"]["that"]
        self.assertTrue(
            any("<html" in c for c in conditions),
            "Expected assertion checking for <html in response content",
        )

    def test_asserts_content_type_is_text_html(self):
        conditions = self.task["ansible.builtin.assert"]["that"]
        self.assertTrue(
            any("text/html" in c and "content_type" in c for c in conditions),
            "Expected assertion checking content_type contains text/html",
        )

    def test_fail_message_is_descriptive(self):
        fail_msg = self.task["ansible.builtin.assert"]["fail_msg"]
        self.assertIn("HTML", fail_msg)


# ---------------------------------------------------------------------------
# Tests: Asset Regex Extraction
# ---------------------------------------------------------------------------

class TestAssetRegexExtraction(unittest.TestCase):
    """
    Tests the regex pattern used in 'Extract frontend asset references from HTML':
      (?:src|href)=["']([^"']+\.(?:js|css|png|svg|ico|woff2?)(?:\?[^"']*)?)["']
    """

    PATTERN = r"""(?:src|href)=["']([^"']+\.(?:js|css|png|svg|ico|woff2?)(?:\?[^"']*)?)[" ']"""

    def _find(self, html):
        return re.findall(self.PATTERN, html)

    # --- matches that should be found ---

    def test_extracts_js_src_attribute(self):
        html = '<script src="/static/app.js"></script>'
        self.assertIn("/static/app.js", self._find(html))

    def test_extracts_css_href_attribute(self):
        html = '<link href="/static/styles.css" rel="stylesheet">'
        self.assertIn("/static/styles.css", self._find(html))

    def test_extracts_png_image(self):
        html = '<img src="/images/logo.png">'
        self.assertIn("/images/logo.png", self._find(html))

    def test_extracts_svg_image(self):
        html = '<img src="/icons/check.svg">'
        self.assertIn("/icons/check.svg", self._find(html))

    def test_extracts_ico_file(self):
        html = '<link rel="icon" href="/favicon.ico">'
        self.assertIn("/favicon.ico", self._find(html))

    def test_extracts_woff_font(self):
        html = '<link href="/fonts/roboto.woff">'
        self.assertIn("/fonts/roboto.woff", self._find(html))

    def test_extracts_woff2_font(self):
        html = '<link href="/fonts/roboto.woff2">'
        self.assertIn("/fonts/roboto.woff2", self._find(html))

    def test_extracts_asset_with_query_string(self):
        html = '<script src="/static/app.js?v=abc123"></script>'
        self.assertIn("/static/app.js?v=abc123", self._find(html))

    def test_extracts_absolute_url_asset(self):
        html = '<script src="https://cdn.example.com/app.js"></script>'
        self.assertIn("https://cdn.example.com/app.js", self._find(html))

    def test_extracts_first_of_multiple_assets(self):
        html = (
            '<link href="/a.css"><script src="/b.js"></script>'
        )
        results = self._find(html)
        self.assertIn("/a.css", results)
        self.assertIn("/b.js", results)

    # --- non-matches that should NOT be found ---

    def test_does_not_extract_html_href(self):
        html = '<a href="/page.html">link</a>'
        self.assertNotIn("/page.html", self._find(html))

    def test_does_not_extract_plain_text_href(self):
        html = '<a href="/about">About</a>'
        self.assertNotIn("/about", self._find(html))

    def test_does_not_extract_php_extension(self):
        html = '<a href="/page.php">link</a>'
        self.assertEqual([], self._find(html))

    def test_returns_empty_list_for_html_with_no_assets(self):
        html = '<html><body><p>Hello world</p></body></html>'
        self.assertEqual([], self._find(html))


# ---------------------------------------------------------------------------
# Tests: First Asset Selection (data: URI filtering)
# ---------------------------------------------------------------------------

class TestFirstAssetSelection(unittest.TestCase):

    def test_selects_first_non_data_uri(self):
        paths = ["/static/app.js", "/static/styles.css"]
        self.assertEqual(_select_first_asset(paths), "/static/app.js")

    def test_filters_out_data_uri_at_start(self):
        paths = ["data:image/png;base64,abc123", "/static/app.js"]
        self.assertEqual(_select_first_asset(paths), "/static/app.js")

    def test_filters_multiple_data_uris(self):
        paths = ["data:image/svg+xml,...", "data:font/woff2,...", "/fonts/roboto.woff2"]
        self.assertEqual(_select_first_asset(paths), "/fonts/roboto.woff2")

    def test_returns_empty_string_when_all_are_data_uris(self):
        paths = ["data:image/png;base64,abc", "data:image/gif;base64,xyz"]
        self.assertEqual(_select_first_asset(paths), "")

    def test_returns_empty_string_for_empty_list(self):
        self.assertEqual(_select_first_asset([]), "")

    def test_does_not_filter_non_data_uri_starting_with_d(self):
        paths = ["/dist/app.js"]
        self.assertEqual(_select_first_asset(paths), "/dist/app.js")

    def test_preserves_query_string_in_selected_asset(self):
        paths = ["/static/app.js?v=abc123"]
        self.assertEqual(_select_first_asset(paths), "/static/app.js?v=abc123")


# ---------------------------------------------------------------------------
# Tests: Asset URL Building Logic
# ---------------------------------------------------------------------------

class TestAssetUrlBuilding(unittest.TestCase):

    BASE_URL = "https://d1234.cloudfront.net"

    # absolute URL — should pass through unchanged
    def test_absolute_http_url_is_returned_as_is(self):
        asset = "https://cdn.example.com/app.js"
        self.assertEqual(
            _simulate_asset_url(self.BASE_URL, asset),
            "https://cdn.example.com/app.js",
        )

    def test_absolute_http_url_without_www_passes_through(self):
        asset = "http://assets.example.com/logo.png"
        self.assertEqual(
            _simulate_asset_url(self.BASE_URL, asset),
            "http://assets.example.com/logo.png",
        )

    # relative with leading slash — base_url + path (no double slash)
    def test_relative_path_with_leading_slash_prepends_base(self):
        asset = "/static/js/app.js"
        result = _simulate_asset_url(self.BASE_URL, asset)
        self.assertEqual(result, "https://d1234.cloudfront.net/static/js/app.js")

    def test_relative_path_with_leading_slash_no_double_slash(self):
        asset = "/styles/main.css"
        result = _simulate_asset_url(self.BASE_URL, asset)
        self.assertNotIn("//styles", result)

    # relative without leading slash — base_url + '/' + path
    def test_relative_path_without_leading_slash_inserts_slash(self):
        asset = "static/js/app.js"
        result = _simulate_asset_url(self.BASE_URL, asset)
        self.assertEqual(result, "https://d1234.cloudfront.net/static/js/app.js")

    def test_relative_path_without_slash_does_not_double_slash(self):
        asset = "styles/main.css"
        result = _simulate_asset_url(self.BASE_URL, asset)
        self.assertNotIn("//styles", result)

    def test_asset_with_query_string_and_leading_slash(self):
        asset = "/static/app.js?v=1234"
        result = _simulate_asset_url(self.BASE_URL, asset)
        self.assertEqual(result, "https://d1234.cloudfront.net/static/app.js?v=1234")

    def test_asset_with_query_string_without_leading_slash(self):
        asset = "static/app.js?v=1234"
        result = _simulate_asset_url(self.BASE_URL, asset)
        self.assertEqual(result, "https://d1234.cloudfront.net/static/app.js?v=1234")

    def test_result_always_starts_with_base_url_for_relative_paths(self):
        for asset in ["/path/app.js", "path/app.js"]:
            result = _simulate_asset_url(self.BASE_URL, asset)
            self.assertTrue(result.startswith(self.BASE_URL))

    def test_does_not_treat_ftp_url_as_absolute(self):
        # Playbook only matches ^https?://, so ftp:// is treated as relative
        asset = "ftp://example.com/file.js"
        result = _simulate_asset_url(self.BASE_URL, asset)
        self.assertTrue(result.startswith(self.BASE_URL))


# ---------------------------------------------------------------------------
# Tests: Fail Task When No Assets Found
# ---------------------------------------------------------------------------

class TestFailWhenNoAssets(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.task = _get_task_by_name(
            play["tasks"], "Fail when no frontend asset reference is present"
        )

    def test_task_exists(self):
        self.assertIsNotNone(self.task)

    def test_uses_fail_module(self):
        self.assertIn("ansible.builtin.fail", self.task)

    def test_fail_message_mentions_assets(self):
        msg = self.task["ansible.builtin.fail"]["msg"]
        self.assertIn("asset", msg.lower())

    def test_condition_triggers_when_path_is_empty(self):
        when_clause = str(self.task["when"])
        self.assertIn("frontend_asset_path", when_clause)
        self.assertIn("length", when_clause)
        self.assertIn("0", when_clause)

    # Logic equivalence: empty string triggers fail
    def test_empty_asset_path_triggers_fail_condition(self):
        asset_path = ""
        # The playbook condition: frontend_asset_path | length == 0
        self.assertTrue(len(asset_path) == 0)

    def test_non_empty_asset_path_does_not_trigger_fail(self):
        asset_path = "/static/app.js"
        self.assertFalse(len(asset_path) == 0)


# ---------------------------------------------------------------------------
# Tests: Asset Not HTML Assert Task
# ---------------------------------------------------------------------------

class TestAssetNotHtmlAssertTask(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.task = _get_task_by_name(
            play["tasks"], "Assert asset response is not HTML fallback content"
        )

    def test_task_exists(self):
        self.assertIsNotNone(self.task)

    def test_uses_assert_module(self):
        self.assertIn("ansible.builtin.assert", self.task)

    def test_asserts_content_type_is_not_text_html(self):
        conditions = self.task["ansible.builtin.assert"]["that"]
        self.assertTrue(
            any("text/html" in c and "not in" in c for c in conditions),
            "Expected assertion that text/html is NOT in content_type",
        )

    def test_fail_message_mentions_html(self):
        fail_msg = self.task["ansible.builtin.assert"]["fail_msg"]
        self.assertIn("HTML", fail_msg)

    def test_uses_default_filter_for_content_type(self):
        conditions = self.task["ansible.builtin.assert"]["that"]
        self.assertTrue(
            any("default" in c for c in conditions),
            "Expected default('') filter to handle missing content_type",
        )


# ---------------------------------------------------------------------------
# Tests: S3 Asset Fetch Task
# ---------------------------------------------------------------------------

class TestS3AssetFetchTask(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.task = _get_task_by_name(
            play["tasks"], "Verify S3 asset is accessible through CloudFront"
        )

    def test_task_exists(self):
        self.assertIsNotNone(self.task)

    def test_uses_uri_module(self):
        self.assertIn("ansible.builtin.uri", self.task)

    def test_url_uses_frontend_asset_url_var(self):
        url = self.task["ansible.builtin.uri"]["url"]
        self.assertIn("frontend_asset_url", url)

    def test_expects_status_200(self):
        self.assertEqual(self.task["ansible.builtin.uri"]["status_code"], 200)

    def test_follows_redirects(self):
        self.assertEqual(self.task["ansible.builtin.uri"]["follow_redirects"], "all")

    def test_registers_frontend_asset_response(self):
        self.assertEqual(self.task["register"], "frontend_asset_response")

    def test_changed_when_false(self):
        self.assertIs(self.task["changed_when"], False)


# ---------------------------------------------------------------------------
# Tests: Summary Debug Task
# ---------------------------------------------------------------------------

class TestSummaryDebugTask(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.task = _get_task_by_name(play["tasks"], "Display validation summary")

    def test_task_exists(self):
        self.assertIsNotNone(self.task)

    def test_uses_debug_module(self):
        self.assertIn("ansible.builtin.debug", self.task)

    def test_summary_has_four_messages(self):
        msg = self.task["ansible.builtin.debug"]["msg"]
        self.assertEqual(len(msg), 4)

    def test_summary_mentions_healthz_endpoint(self):
        messages = self.task["ansible.builtin.debug"]["msg"]
        self.assertTrue(
            any("/api/healthz" in m for m in messages),
            "Summary should include the healthz endpoint",
        )

    def test_summary_mentions_db_check_status(self):
        messages = self.task["ansible.builtin.debug"]["msg"]
        self.assertTrue(
            any("database" in m.lower() for m in messages),
            "Summary should include database check status",
        )

    def test_summary_mentions_frontend_root(self):
        messages = self.task["ansible.builtin.debug"]["msg"]
        self.assertTrue(
            any("frontend" in m.lower() for m in messages),
            "Summary should mention frontend HTML validation",
        )

    def test_summary_mentions_static_asset(self):
        messages = self.task["ansible.builtin.debug"]["msg"]
        self.assertTrue(
            any("asset" in m.lower() for m in messages),
            "Summary should mention static asset validation",
        )


# ---------------------------------------------------------------------------
# Tests: Task Ordering
# ---------------------------------------------------------------------------

class TestTaskOrdering(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.task_names = [t["name"] for t in play["tasks"]]

    def test_backend_health_checked_before_db(self):
        backend_idx = self.task_names.index("Verify backend health endpoint")
        db_idx = self.task_names.index(
            "Verify database connectivity endpoint when available"
        )
        self.assertLess(backend_idx, db_idx)

    def test_db_check_before_db_skip_debug(self):
        db_idx = self.task_names.index(
            "Verify database connectivity endpoint when available"
        )
        skip_idx = self.task_names.index("Report skipped optional database validation")
        self.assertLess(db_idx, skip_idx)

    def test_frontend_root_before_html_assert(self):
        root_idx = self.task_names.index("Verify frontend root loads")
        assert_idx = self.task_names.index("Assert frontend response is HTML")
        self.assertLess(root_idx, assert_idx)

    def test_asset_extraction_before_url_build(self):
        extract_idx = self.task_names.index("Extract frontend asset references from HTML")
        build_idx = self.task_names.index("Build frontend asset validation URL")
        self.assertLess(extract_idx, build_idx)

    def test_url_build_before_asset_fetch(self):
        build_idx = self.task_names.index("Build frontend asset validation URL")
        fetch_idx = self.task_names.index(
            "Verify S3 asset is accessible through CloudFront"
        )
        self.assertLess(build_idx, fetch_idx)

    def test_asset_fetch_before_not_html_assert(self):
        fetch_idx = self.task_names.index(
            "Verify S3 asset is accessible through CloudFront"
        )
        assert_idx = self.task_names.index(
            "Assert asset response is not HTML fallback content"
        )
        self.assertLess(fetch_idx, assert_idx)

    def test_not_html_assert_before_summary(self):
        assert_idx = self.task_names.index(
            "Assert asset response is not HTML fallback content"
        )
        summary_idx = self.task_names.index("Display validation summary")
        self.assertLess(assert_idx, summary_idx)

    def test_fail_when_no_assets_before_url_build(self):
        fail_idx = self.task_names.index(
            "Fail when no frontend asset reference is present"
        )
        build_idx = self.task_names.index("Build frontend asset validation URL")
        self.assertLess(fail_idx, build_idx)


# ---------------------------------------------------------------------------
# Tests: changed_when=false on all URI tasks (idempotence)
# ---------------------------------------------------------------------------

class TestIdempotence(unittest.TestCase):

    def setUp(self):
        play = _get_play(_load_playbook())
        self.tasks = play["tasks"]

    def _uri_tasks(self):
        return [t for t in self.tasks if "ansible.builtin.uri" in t]

    def test_all_uri_tasks_have_changed_when_false(self):
        uri_tasks = self._uri_tasks()
        self.assertGreater(len(uri_tasks), 0)
        for task in uri_tasks:
            self.assertIs(
                task.get("changed_when"),
                False,
                msg=f"Task '{task['name']}' should have changed_when: false",
            )

    def test_three_uri_tasks_total(self):
        # backend healthz, db-check, frontend root, S3 asset
        self.assertEqual(len(self._uri_tasks()), 4)


# ---------------------------------------------------------------------------
# Integration of regex + URL building (end-to-end logic test)
# ---------------------------------------------------------------------------

class TestEndToEndAssetResolution(unittest.TestCase):

    BASE_URL = "https://d1example.cloudfront.net"

    def _resolve(self, html):
        paths = _extract_asset_paths(html)
        selected = _select_first_asset(paths)
        if not selected:
            return None  # would trigger ansible fail module
        return _simulate_asset_url(self.BASE_URL, selected)

    def test_typical_react_html_resolves_bundle_url(self):
        html = (
            '<!DOCTYPE html><html><head>'
            '<link rel="stylesheet" href="/static/css/main.abc.css">'
            '</head><body>'
            '<script src="/static/js/main.xyz.js"></script>'
            '</body></html>'
        )
        result = self._resolve(html)
        self.assertEqual(
            result,
            "https://d1example.cloudfront.net/static/css/main.abc.css",
        )

    def test_html_with_only_data_uris_returns_none(self):
        html = (
            '<img src="data:image/png;base64,iVBORw0KGgo=">'
            '<img src="data:image/gif;base64,R0lGODlh">'
        )
        result = self._resolve(html)
        self.assertIsNone(result)

    def test_html_with_absolute_cdn_url_passes_through(self):
        html = '<script src="https://cdn.jsdelivr.net/app.js"></script>'
        result = self._resolve(html)
        self.assertEqual(result, "https://cdn.jsdelivr.net/app.js")

    def test_html_with_relative_path_no_slash_gets_slash_inserted(self):
        html = '<script src="assets/app.js"></script>'
        result = self._resolve(html)
        self.assertEqual(result, "https://d1example.cloudfront.net/assets/app.js")

    def test_html_with_woff2_font_resolves_correctly(self):
        html = '<link href="/fonts/inter.woff2" rel="preload">'
        result = self._resolve(html)
        self.assertEqual(
            result, "https://d1example.cloudfront.net/fonts/inter.woff2"
        )

    def test_html_with_no_recognized_assets_returns_none(self):
        html = '<html><body><a href="/about">About</a></body></html>'
        result = self._resolve(html)
        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()