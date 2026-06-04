import unittest
from unittest.mock import MagicMock, patch

from main import get_roles, get_unusual_signals


class SignalTests(unittest.TestCase):
    def test_nvidia_signal_frames_data_center_hiring_as_hyperscaler_competition(self):
        roles = [
            {"company_slug": "nvidia", "title": "Principal Engineer, Data Center Power Software"},
            {"company_slug": "nvidia", "title": "Senior Solutions Architect, AI Infrastructure"},
            {"company_slug": "nvidia", "title": "Senior DGX Cloud AI Infrastructure Software Engineer"},
        ]

        with patch("main.fetch_all_roles", return_value=roles):
            signal = get_unusual_signals(days=30, company_slug="nvidia")["nvidia"]

        self.assertEqual(signal["label"], "Competing in AI infrastructure")
        self.assertIn("Amazon", signal["description"])
        self.assertIn("Google", signal["description"])

    def test_mistral_signal_prefers_deployment_consulting_over_legal(self):
        roles = [
            {"company_slug": "mistral", "title": "AI Deployment Strategist - Sweden"},
            {"company_slug": "mistral", "title": "Applied AI, Forward Deployed Machine Learning Engineer, Critical and Sovereign Institutions, EMEA"},
            {"company_slug": "mistral", "title": "Legal Counsel, M&A"},
            {"company_slug": "mistral", "title": "Privacy Legal Counsel"},
        ]

        with patch("main.fetch_all_roles", return_value=roles):
            signal = get_unusual_signals(days=30, company_slug="mistral")["mistral"]

        self.assertEqual(signal["label"], "Building an AI deployment consultancy")
        self.assertIn("Accenture", signal["description"])
        self.assertIn("PwC", signal["description"])

    def test_roles_endpoint_returns_50_role_pages_with_total_and_has_more(self):
        roles = [
            {
                "id": i,
                "company_slug": "nvidia",
                "title": f"Role {i:03d}",
                "category": "Infrastructure" if i % 2 else "Research",
                "country": "US",
                "last_seen_at": f"2026-06-01T00:{i:02d}:00+00:00",
                "source_url": f"https://example.com/{i}",
            }
            for i in range(70)
        ]
        companies = type("Response", (), {"data": [{"slug": "nvidia", "name": "Nvidia"}]})()
        page = type("Response", (), {"data": roles[:50]})()
        companies_table = MagicMock()
        companies_table.select.return_value.execute.return_value = companies
        roles_query = MagicMock()
        roles_query.select.return_value = roles_query
        roles_query.gte.return_value = roles_query
        roles_query.order.return_value = roles_query
        roles_query.range.return_value = roles_query
        roles_query.eq.return_value = roles_query
        roles_query.execute.return_value = page

        with patch("main.fetch_all_roles", return_value=roles), patch(
            "main.supabase.table", side_effect=lambda name: companies_table if name == "companies" else roles_query
        ):
            result = get_roles(days=30, company_slug="nvidia", limit=50, offset=0)

        self.assertEqual(result["total"], 70)
        self.assertEqual(len(result["roles"]), 50)
        self.assertTrue(result["hasMore"])
        self.assertEqual(result["nextOffset"], 50)
        self.assertEqual(result["facets"]["category"][0]["count"], 35)
        roles_query.range.assert_called_once_with(0, 49)


if __name__ == "__main__":
    unittest.main()
