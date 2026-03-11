import unittest
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

try:
    from api.document_center import is_valid_transition
except ModuleNotFoundError:
    is_valid_transition = None  # type: ignore


@unittest.skipIf(is_valid_transition is None, "backend dependencies are not installed")
class DocumentCenterWorkflowTest(unittest.TestCase):
    def test_valid_transitions(self):
        self.assertTrue(is_valid_transition("draft", "submitted"))
        self.assertTrue(is_valid_transition("submitted", "approved"))
        self.assertTrue(is_valid_transition("approved", "paid"))
        self.assertTrue(is_valid_transition("approved", "invoiced"))
        self.assertTrue(is_valid_transition("paid", "closed"))

    def test_invalid_transitions(self):
        self.assertFalse(is_valid_transition("draft", "approved"))
        self.assertFalse(is_valid_transition("submitted", "paid"))
        self.assertFalse(is_valid_transition("closed", "submitted"))
        self.assertFalse(is_valid_transition("cancelled", "approved"))


if __name__ == "__main__":
    unittest.main()
