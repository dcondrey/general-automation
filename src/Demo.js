const Demo = {
  rows() {
    return [
      ['Brand Management', 'Copy weekly metrics into a second status sheet', 'Brand lead', 5, 30, 2, 0, 0, 'No', 'No', 100, 0.5, 'Planned', '', '', 'Fictional: the team already reads the source dashboard.', 'demo-1'],
      ['Supply Chain', 'Reconcile inventory exports', 'Supply chain lead', 5, 45, 2, 10, 20, 'Yes', 'No', 80, 8, 'Planned', '', '', 'Fictional: clean keys before joining exports.', 'demo-2'],
      ['Catalog', 'Chase missing inputs before a listing update', 'Catalog lead', 20, 12, 1, 25, 10, 'Yes', 'Yes', 60, 12, 'Planned', '', '', 'Fictional: one intake checklist may remove most follow-ups.', 'demo-3'],
      ['Client Services', 'Assemble weekly client reports', 'Account lead', 10, 30, 1, 5, 10, 'Yes', 'No', 75, 10, 'Live', 3.5, '2026-01-15', 'Fictional: measured savings shown only to demonstrate the chart.', 'demo-4'],
      ['Operations', 'Prepare a sensitive exception decision', 'Operations lead', 3, 20, 1, 0, 0, 'Yes', 'No', 0, 2, 'Planned', '', '', 'Fictional: keep the decision with a person.', 'demo-5'],
      ['Finance', 'Reconcile an unclear duplicate report', 'Finance lead', 1, 60, 1, 0, 0, 'Unsure', 'Unsure', 80, '', 'Planned', '', '', 'Fictional: establish who uses the output first.', 'demo-6'],
    ].map(row => row.slice(0, 16).concat([0, '', row[16]]));
  },
};
