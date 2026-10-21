import { describe, expect, it } from "vite-plus/test";
import {
  tableColumnCount,
  tableColumnWeights,
  tableGridTemplate,
  tableHeight,
  tableNumericColumns,
  tableMinWidth,
  tableWeightsAt,
  tableWidth,
  TABLE_COLHEAD_H,
  TABLE_TITLE_H,
} from "#src/canvas/headless/table-layout.js";

const PLANS = {
  headers: ["Plan", "Price", "Included", "Pick it when"],
  rows: [
    {
      cells: [
        "Free",
        "$0",
        "5 projects, memory, connectors, artifacts, Sonnet and Haiku",
        "You are setting up loads 1 and 2",
      ],
    },
    {
      cells: [
        "Pro",
        "$20 a month",
        "Scheduled work, Claude Code, Opus, Slides, Docs, Chrome, Microsoft 365",
        "You want everything in this video",
      ],
    },
  ],
};

describe("tableColumnWeights", () => {
  it("gives the long column more room than the short one", () => {
    const [plan, price, included] = tableColumnWeights(PLANS.headers, PLANS.rows);
    expect(included).toBeGreaterThan(price);
    expect(price).toBeGreaterThan(plan);
  });

  it("sums to one", () => {
    const total = tableColumnWeights(PLANS.headers, PLANS.rows).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 6);
  });

  it("reads the author's weights as relative, not absolute", () => {
    const small = tableColumnWeights(PLANS.headers, PLANS.rows, [1, 1, 3, 2]);
    const large = tableColumnWeights(PLANS.headers, PLANS.rows, [10, 10, 30, 20]);
    expect(small).toEqual(large);
    expect(small[2]).toBeCloseTo(3 / 7, 6);
  });

  it("ignores a weight list that does not cover every column", () => {
    const partial = tableColumnWeights(PLANS.headers, PLANS.rows, [1, 2]);
    expect(partial).toEqual(tableColumnWeights(PLANS.headers, PLANS.rows));
  });

  it("keeps a one-word column readable instead of hairline thin", () => {
    const weights = tableColumnWeights(["Id", "Detail"], [{ cells: ["a", "a".repeat(200)] }]);
    expect(weights[0]).toBeGreaterThan(0.1);
  });
});

describe("tableGridTemplate", () => {
  it("floors every track at zero so a long cell cannot widen its column", () => {
    expect(tableGridTemplate([0.25, 0.75])).toBe("minmax(0, 0.2500fr) minmax(0, 0.7500fr)");
  });
});

describe("tableNumericColumns", () => {
  it("marks a column of figures and leaves prose alone", () => {
    const rows = [{ cells: ["Free", "$0", "5 projects"] }, { cells: ["Pro", "$20", "everything"] }];
    expect(tableNumericColumns(rows, 3)).toEqual([false, true, false]);
  });

  it("does not mark a column where one cell carries words", () => {
    const rows = [{ cells: ["$0"] }, { cells: ["$20 a month"] }];
    expect(tableNumericColumns(rows, 1)).toEqual([false]);
  });
});

describe("tableHeight", () => {
  it("keeps every row to one line when the columns are content-sized", () => {
    const wide = tableHeight(PLANS.headers, PLANS.rows, 1320);
    // Title + heads + two single-line rows. Anything taller means a wrap.
    expect(wide).toBeLessThan(TABLE_TITLE_H + TABLE_COLHEAD_H + 2 * 40);
  });

  it("grows when the same table is squeezed", () => {
    expect(tableHeight(PLANS.headers, PLANS.rows, 420)).toBeGreaterThan(
      tableHeight(PLANS.headers, PLANS.rows, 1320),
    );
  });

  it("still has a height with no rows", () => {
    expect(tableHeight(PLANS.headers, [], 480)).toBeGreaterThan(80);
  });
});

describe("tableColumnCount", () => {
  it("takes the widest row when it runs past the headers", () => {
    expect(tableColumnCount(["A"], [{ cells: ["a", "b", "c"] }])).toBe(3);
  });
});

describe("tableWidth", () => {
  // The "Has to keep working" table of the Solusign board, stored 1320px wide.
  const KEEP = {
    headers: ["What", "Until"],
    rows: [
      { cells: ["Avoma webhooks, which only reach you through Zapier", "The app takes them in"] },
      { cells: ["Fillout webhooks", "The app takes them in"] },
      { cells: ["The Apps Script email sync", "Always"] },
      { cells: ["Make and Zapier", "It runs in the app instead"] },
      { cells: ["Any Airtable table", "That table is cut over"] },
    ],
  };

  it("fits two short columns to their content, not to the stored width", () => {
    const width = tableWidth(KEEP.headers, KEEP.rows, 1320);
    expect(width).toBeGreaterThanOrEqual(500);
    expect(width).toBeLessThanOrEqual(560);
  });

  it("never grows past the width it was asked for", () => {
    expect(tableWidth(KEEP.headers, KEEP.rows, 400)).toBe(400);
  });

  it("splits by content once the card has room, whatever weights the author wrote", () => {
    const width = tableWidth(KEEP.headers, KEEP.rows, 1320);
    const [what, until] = tableWeightsAt(KEEP.headers, KEEP.rows, width, { explicit: [2, 3] });
    expect(what).toBeGreaterThan(until);
  });
});

describe("tableWidth font", () => {
  const rows = [
    {
      cells: [
        "Avoma webhooks, which only reach you through Zapier",
        "The app takes them in until the cutover is done",
      ],
    },
  ];

  it("gives the hand font more room than the plain one", () => {
    expect(tableWidth(["What", "Until"], rows, undefined, "hand")).toBeGreaterThan(
      tableWidth(["What", "Until"], rows, undefined, "plain"),
    );
  });

  it("will not let a drag squeeze a column under its floor", () => {
    expect(tableMinWidth(["What", "Until"], rows)).toBeGreaterThanOrEqual(2 * 84);
  });
});
