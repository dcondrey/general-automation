# Sheets formula cookbook

These formulas target the Discovery workbook's canonical columns. They are authored examples until marked executed in [validation](../docs/compatibility.md). Put exploratory formulas on a new tab so ranking does not replace them. Sheets uses English function names below; your locale may require semicolons between function arguments when pasting manually.

## Department totals with QUERY

```excel
=QUERY(Ranked!A1:O2001,"select B,sum(F),sum(G),sum(K) where C is not null group by B label B 'Department',sum(F) 'Current h/week',sum(G) 'Net potential h/week',sum(K) 'Measured h/week'",1)
```

The first row contains headings. `F` is the current baseline, `G` is net potential, and `K` is observed savings. An empty measured aggregate is not evidence of zero savings. Invalid or overlapping rows are absent from Ranked and listed in Issues.

## Actionable opportunities with FILTER and SORT

```excel
=IFERROR(SORT(FILTER(Ranked!B2:I2001,Ranked!G2:G2001>0,Ranked!E2:E2001<>"Investigate"),6,FALSE),"No positive-saving candidates")
```

This returns department through payback, sorted by potential hours. It is a different view from the kit's benefit-per-implementation-hour ranking. Status is maintained in Backlog; use the report's next-three list when selecting unlaunched work.

## Comparable forecast on measured processes only, with LET

```excel
=LET(observed,Ranked!K2:K2001,potential,Ranked!G2:G2001,IF(COUNT(observed)=0,"Not measured",SUM(FILTER(potential,ISNUMBER(observed)))))
```

Compare this subtotal with `SUM(Ranked!K2:K2001)`. Comparing the whole portfolio forecast against the measured subset would mix populations. `ISNUMBER` includes an explicit measured zero.

## Measurement coverage with COUNT and COUNTA

```excel
=IFERROR(COUNT(Ranked!K2:K2001)/COUNTA(Ranked!C2:C2001),0)
```

Format as a percentage. Coverage measures rows with an observation, not measurement quality or causal impact.

## Weekly team effort with the custom function

```excel
=WEEKLY_WORK_HOURS(10,30,2,20,15)
```

Expected result: `10.5` hours/week. Arguments are runs/week, minutes per person, people, error rate from 0 to 100, and total team rework minutes per failed run. This runs without Forms or Docs calls and rejects malformed or out-of-range inputs. The same calculation backs the ranker.

## Row calculations without Apps Script, using MAP and LAMBDA

On an otherwise empty tab:

```excel
=MAP(Backlog!D2:D101,Backlog!E2:E101,Backlog!F2:F101,Backlog!G2:G101,Backlog!H2:H101,LAMBDA(r,m,p,e,w,IF(OR(r="",m=""),"",r*(m*IF(p="",1,p)+IF(e="",0,e)/100*IF(w="",0,w))/60)))
```

This reproduces the baseline for up to 100 input rows. It assumes valid numeric source cells and does not replace the ranker's input validation, overlap checks, or decision logic. Paste `0` explicitly for zero runs or duration. Blank people defaults to one.

## Reproducible fixture

Use this small table to check `QUERY`, `FILTER`, `LET`, and measurement coverage independently of the kit:

| Process | Potential | Measured |
| --- | ---: | ---: |
| A | 5 | 4 |
| B | 3 | *(leave the cell empty)* |
| C | 2 | 0 |

The potential on measured processes is `7`; total measured is `4`; measurement coverage is `2/3`. Do not enter the explanatory italic text into the empty cell. A zero-length formula result and a physically empty cell can behave differently in aggregations, so verify the actual ranges in Google Sheets.
