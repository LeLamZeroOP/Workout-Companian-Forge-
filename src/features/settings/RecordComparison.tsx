import { canonical } from '../../domain/canonical';

function flatten(value: unknown, prefix = ''): Array<[string, string]> {
  if (value === null || value === undefined) return [[prefix || 'Record', 'Not present']];
  if (typeof value !== 'object') return [[prefix || 'Value', typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value)]];
  return Object.entries(value).flatMap(([key, item]) => flatten(item, prefix ? `${prefix} / ${key}` : key));
}
export function RecordComparison({ local, cloud }: { local: unknown; cloud: unknown }) {
  const left = new Map(flatten(local)); const right = new Map(flatten(cloud));
  const keys = [...new Set([...left.keys(), ...right.keys()])].filter((key) => left.get(key) !== right.get(key));
  if (canonical(local) === canonical(cloud)) return <p>Already present with identical content.</p>;
  return <details><summary>Compare differing fields ({keys.length})</summary><div className="table-scroll"><table className="data-table"><thead><tr><th>Field</th><th>Source / this device</th><th>Account</th></tr></thead><tbody>{keys.map((key) => <tr key={key}><th scope="row">{key.replace(/([a-z])([A-Z])/g, '$1 $2')}</th><td>{left.get(key) ?? 'Not present'}</td><td>{right.get(key) ?? 'Not present'}</td></tr>)}</tbody></table></div></details>;
}
