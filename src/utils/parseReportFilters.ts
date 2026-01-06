/**
 * Helper to safely parse report filters from req.query
 * Supports:
 *  - vendor=1,2,3
 *  - vendor[]=1&vendor[]=2
 *  - single values vendor=5
 *  - empty / missing values => ALL
 */

type QueryValue = string | string[] | undefined;

/**
 * Generic array parser
 */
const parseArray = <T = string>(
  value: QueryValue,
  mapper?: (val: string) => T
): T[] | undefined => {
  if (!value) return undefined;

  const rawArray = Array.isArray(value)
    ? value
    : value.split(',');

  const parsed = rawArray
    .map(v => v.trim())
    .filter(v => v.length > 0)
    .map(v => (mapper ? mapper(v) : (v as unknown as T)));

  return parsed.length ? parsed : undefined;
};

/**
 * Main filter parser
 */
export const parseReportFilters = (query: any) => {
  return {
    /** DATE FILTER */
    fromDate: query.fromDate,
    toDate: query.toDate,

    /** ITEM LEVEL FILTERS */
    salesCategory: parseArray(query.salesCategory),
    priceClass: parseArray(query.priceClass),
    pickArea: parseArray(query.pickArea),

    vendor: parseArray(query.vendor, Number),
    item: parseArray(query.item, Number),

    /** CUSTOMER LEVEL FILTERS */
    customer: parseArray(query.customer, Number),
    salesRep: parseArray(query.salesRep, Number),
    route: parseArray(query.route),
    location: parseArray(query.location),
    section: parseArray(query.section),
  };
};
