import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

try:
    from api.workpoints import _actual_overtime_hours, _workhour_from_period, _apply_payroll_adjustments, _sum_payroll_adjustments
except ModuleNotFoundError:
    _actual_overtime_hours = None  # type: ignore
    _workhour_from_period = None  # type: ignore
    _apply_payroll_adjustments = None  # type: ignore
    _sum_payroll_adjustments = None  # type: ignore


@unittest.skipIf(_actual_overtime_hours is None, "backend dependencies are not installed")
class WorkpointLogicTest(unittest.TestCase):
    def test_actual_overtime_falls_back_without_checkout(self):
        self.assertEqual(
            _actual_overtime_hours(
                {
                    "in": {"time": "2026-04-01T18:00:00"},
                }
            ),
            4.0,
        )

    def test_actual_overtime_timezone_aware(self):
        self.assertEqual(
            _actual_overtime_hours(
                {
                    "in": {"time": "2026-04-01T11:00:00Z"},
                }
            ),
            4.0,
        )

    def test_actual_overtime_uses_real_checkout_when_present(self):
        self.assertEqual(
            _actual_overtime_hours(
                {
                    "in": {"time": "2026-04-01T18:00:00"},
                    "out": {"time": "2026-04-01T20:30:00"},
                }
            ),
            2.5,
        )

    def test_regular_workhours_can_still_fall_back_to_default_end_time(self):
        self.assertEqual(
            _workhour_from_period(
                {
                    "in": {"time": "2026-04-01T08:00:00"},
                },
                "morning",
            ),
            4.0,
        )

    def test_sum_payroll_adjustments_respects_signs(self):
        adjustments = [
            type("Adj", (), {"adjustment_type": "bonus", "amount": 500_000})(),
            type("Adj", (), {"adjustment_type": "punish", "amount": 120_000})(),
            type("Adj", (), {"adjustment_type": "advance", "amount": 300_000})(),
            type("Adj", (), {"adjustment_type": "commission", "amount": 90_000})(),
        ]
        totals = _sum_payroll_adjustments(adjustments)
        self.assertEqual(totals["bonus"], 500_000)
        self.assertEqual(totals["punish"], 120_000)
        self.assertEqual(totals["advance"], 300_000)
        self.assertEqual(totals["commission"], 90_000)
        self.assertEqual(totals["net"], 170_000)

    def test_apply_payroll_adjustments_updates_row_totals(self):
        row = {
            "bonus_total": 1_000_000,
            "punish_total": -200_000,
            "advance_total": 500_000,
            "allowance": 300_000,
            "bhyt": 100_000,
            "bhxh": 200_000,
            "net_salary": 10_000_000,
        }
        adjusted = _apply_payroll_adjustments(
            row,
            {
                "bonus": 250_000,
                "punish": 50_000,
                "advance": 100_000,
                "commission": 0,
                "allowance": 20_000,
                "bhyt": 10_000,
                "bhxh": 30_000,
                "carry_forward": 0,
                "net": 80_000,
            },
        )
        self.assertEqual(adjusted["bonus_total"], 1_250_000)
        self.assertEqual(adjusted["punish_total"], -250_000)
        self.assertEqual(adjusted["advance_total"], 600_000)
        self.assertEqual(adjusted["allowance"], 320_000)
        self.assertEqual(adjusted["bhyt"], 110_000)
        self.assertEqual(adjusted["bhxh"], 230_000)
        self.assertEqual(adjusted["net_salary"], 10_080_000)


if __name__ == "__main__":
    unittest.main()
