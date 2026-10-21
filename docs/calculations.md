# Discovery calculations

Use a consistent boundary for each process: how often it runs, how many people participate, and the total team rework when a run fails. Fractional frequency supports work that happens less than weekly.

```text
current hours/week = runs × (minutes × people + error fraction × rework minutes) / 60
gross saving       = current hours × removable fraction
net potential      = max(0, gross saving − weekly upkeep hours)
payback weeks      = implementation hours / net potential
annual capacity    = net potential × working weeks/year × hourly cost
```

Rework minutes already includes the team's effort. Implementation effort includes building, rollout, training, and handoff. Annual capacity value assumes constant workload and hourly cost; it is not a cash saving or a reduction in staffing.

## Recommendations

| Condition | Recommendation | Savings treatment |
| --- | --- | --- |
| Output is unnecessary | Delete | Uses the full baseline, minus any upkeep; confirm required obligations before retiring work. |
| Purpose or redesign requirements are unclear | Investigate | Withholds the estimate. |
| Estimated removable work does not exceed upkeep | Keep manual | Zero net saving. |
| Process needs simplification | Redesign first | Provisional estimate requiring validation after redesign. |
| Output is needed and removable work exceeds upkeep | Automate | Estimated net benefit. |

Rank by net weekly benefit per implementation hour, then net hours, then source row. Payback is undefined when the benefit is zero. Blank effort and removable-share inputs use the visible defaults, with assumptions listed in the result.

## Overlap

A normalized **Overlap group** appearing on multiple otherwise-valid rows excludes every row in that group. Merge shared work into one defensible baseline, or confirm that the processes measure independent staff time before separating their groups. Unmarked overlap cannot be detected reliably from short descriptions.

## Progress and measurements

**Live** and **Paused** processes stay in the source data but are excluded from remaining opportunity. Detailed portfolio potential includes Live work; it is not an estimate of additional savings.

Observed savings require **Status = Live**, a valid measurement date, and a value no greater than the baseline. Blank means unmeasured; zero means an observation found no saving. The current observation contributes to the total once. Earlier observations remain in Savings history and are never added as extra weekly savings.

Editing a process keeps its identity, plan, current observation, and historical evidence. A revised baseline must still cover its observed saving. Finish a pending measurement before editing that process. An outdated editor cannot overwrite another person's changed values.

## Example

Five runs per week at 45 minutes per person with two people, plus a 10% chance of 20 team minutes of rework, costs **7.6667 hours/week**. At 80% removable effort and 30 minutes of weekly upkeep, net potential is **5.6333 hours/week**. Eight implementation hours produces **1.4201 weeks** of estimated payback.

These are illustrative inputs. Confirm the baseline with its owner and measure the same process boundary after launch.
