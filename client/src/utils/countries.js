/**
 * Country list for the checkout shipping form.
 *
 * We keep only the ISO 3166-1 alpha-2 codes here and resolve human-readable
 * names at runtime via Intl.DisplayNames (supported in every browser our
 * checkout targets). This keeps the list correct and avoids hand-maintaining
 * ~250 country names. India is pinned to the top since it's the primary market.
 */

const ISO_CODES = [
  'AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ',
  'BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BA','BW','BR','IO','BN',
  'BG','BF','BI','KH','CM','CA','CV','KY','CF','TD','CL','CN','CX','CC','CO','KM',
  'CG','CD','CK','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV',
  'GQ','ER','EE','ET','FK','FO','FJ','FI','FR','GF','PF','GA','GM','GE','DE','GH',
  'GI','GR','GL','GD','GP','GU','GT','GG','GN','GW','GY','HT','HN','HK','HU','IS',
  'IN','ID','IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP',
  'KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MK','MG','MW',
  'MY','MV','ML','MT','MH','MQ','MR','MU','YT','MX','FM','MD','MC','MN','ME','MS',
  'MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI','NE','NG','NU','NF','MP','NO',
  'OM','PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR','QA','RE','RO',
  'RU','RW','BL','SH','KN','LC','MF','PM','VC','WS','SM','ST','SA','SN','RS','SC',
  'SL','SG','SK','SI','SB','SO','ZA','SS','ES','LK','SD','SR','SZ','SE','CH','SY',
  'TW','TJ','TZ','TH','TL','TG','TK','TO','TT','TN','TR','TM','TC','TV','UG','UA',
  'AE','GB','US','UY','UZ','VU','VA','VE','VN','VG','VI','WF','YE','ZM','ZW',
];

let displayNames = null;
try {
  if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
    displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
  }
} catch {
  displayNames = null;
}

const nameFor = (code) => {
  try {
    return (displayNames && displayNames.of(code)) || code;
  } catch {
    return code;
  }
};

/** ISO2 code (e.g. "US") → display name (e.g. "United States"). Falls back to the code. */
export const countryNameFromCode = (code) => {
  if (!code) return '';
  return nameFor(code.toString().toUpperCase());
};

/** [{ code, name }] sorted by name, with India first. */
export const COUNTRIES = (() => {
  const list = ISO_CODES.map((code) => ({ code, name: nameFor(code) }));
  list.sort((a, b) => a.name.localeCompare(b.name));
  const india = list.find((c) => c.code === 'IN');
  const rest = list.filter((c) => c.code !== 'IN');
  return india ? [india, ...rest] : list;
})();

/** True when the given country name/code represents India (the domestic default). */
export const isIndia = (country) => {
  const v = (country || '').toString().trim().toLowerCase();
  return v === 'india' || v === 'in';
};
