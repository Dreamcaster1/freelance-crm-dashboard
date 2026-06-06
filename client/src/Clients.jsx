import { useMemo, useState } from 'react'
import Badge from './Badge'
import { IconPlus, IconSearch } from './icons'

const CLIENTS = [
  {
    id: 'c1',
    company: 'Northline Studio',
    contact: 'Sarah Chen',
    email: 'sarah@northline.studio',
    status: { label: 'Active', variant: 'success' },
    projectValue: 18500,
    lastActivity: '2 hours ago',
  },
  {
    id: 'c2',
    company: 'Brightpath Labs',
    contact: 'Marcus Webb',
    email: 'marcus@brightpath.io',
    status: { label: 'Active', variant: 'success' },
    projectValue: 12400,
    lastActivity: '5 hours ago',
  },
  {
    id: 'c3',
    company: 'Harbor & Co.',
    contact: 'Elena Vasquez',
    email: 'elena@harborco.com',
    status: { label: 'On hold', variant: 'warning' },
    projectValue: 8200,
    lastActivity: 'Yesterday',
  },
  {
    id: 'c4',
    company: 'Elmwood Digital',
    contact: 'James Okonkwo',
    email: 'james@elmwood.digital',
    status: { label: 'Active', variant: 'success' },
    projectValue: 9600,
    lastActivity: 'Yesterday',
  },
  {
    id: 'c5',
    company: 'Summit Health',
    contact: 'Priya Nair',
    email: 'priya@summithealth.org',
    status: { label: 'Active', variant: 'success' },
    projectValue: 22000,
    lastActivity: 'Jun 4',
  },
  {
    id: 'c6',
    company: 'Lumen Analytics',
    contact: 'David Park',
    email: 'david@lumenanalytics.com',
    status: { label: 'Lead', variant: 'info' },
    projectValue: 0,
    lastActivity: 'Jun 3',
  },
  {
    id: 'c7',
    company: 'Atlas Ventures',
    contact: 'Rachel Kim',
    email: 'rachel@atlasvc.com',
    status: { label: 'Lead', variant: 'info' },
    projectValue: 0,
    lastActivity: 'Jun 2',
  },
  {
    id: 'c8',
    company: 'Copperline Media',
    contact: 'Tom Bradley',
    email: 'tom@copperline.media',
    status: { label: 'At risk', variant: 'danger' },
    projectValue: 5400,
    lastActivity: 'May 30',
  },
  {
    id: 'c9',
    company: 'Fieldstone Retail',
    contact: 'Amira Hassan',
    email: 'amira@fieldstone.co',
    status: { label: 'Active', variant: 'success' },
    projectValue: 14800,
    lastActivity: 'May 29',
  },
  {
    id: 'c10',
    company: 'Waypoint Travel',
    contact: 'Chris Dalton',
    email: 'chris@waypoint.travel',
    status: { label: 'Inactive', variant: 'neutral' },
    projectValue: 3200,
    lastActivity: 'May 15',
  },
  {
    id: 'c11',
    company: 'Nova Education',
    contact: 'Lisa Fernandez',
    email: 'lisa@novaedu.org',
    status: { label: 'Active', variant: 'success' },
    projectValue: 11200,
    lastActivity: 'May 12',
  },
  {
    id: 'c12',
    company: 'Redwood Legal',
    contact: 'Owen Mitchell',
    email: 'owen@redwoodlegal.com',
    status: { label: 'On hold', variant: 'warning' },
    projectValue: 6700,
    lastActivity: 'May 8',
  },
]

function getInitials(company) {
  return company
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function formatCurrency(amount) {
  if (amount === 0) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function Clients() {
  const [query, setQuery] = useState('')

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return CLIENTS

    return CLIENTS.filter(
      (client) =>
        client.company.toLowerCase().includes(normalized) ||
        client.contact.toLowerCase().includes(normalized) ||
        client.email.toLowerCase().includes(normalized),
    )
  }, [query])

  return (
    <div className="clients">
      <div className="clients-toolbar">
        <label className="clients-search">
          <IconSearch className="clients-search__icon" />
          <input
            type="search"
            className="clients-search__input"
            placeholder="Search by company, contact, or email..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="button" className="btn btn--primary">
          <IconPlus />
          Add Client
        </button>
      </div>

      <div className="clients-table-card">
        <div className="table-scroll">
        <table className="clients-table">
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col">Contact</th>
              <th scope="col">Status</th>
              <th scope="col" className="clients-table__align-right">
                Project Value
              </th>
              <th scope="col" className="clients-table__align-right">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="client-company">
                      <span className="client-avatar" aria-hidden="true">
                        {getInitials(client.company)}
                      </span>
                      <span className="client-company__name">{client.company}</span>
                    </div>
                  </td>
                  <td>
                    <div className="client-contact">
                      <span className="client-contact__name">{client.contact}</span>
                      <span className="client-contact__email">{client.email}</span>
                    </div>
                  </td>
                  <td>
                    <Badge {...client.status} />
                  </td>
                  <td className="clients-table__align-right clients-table__value">
                    {formatCurrency(client.projectValue)}
                  </td>
                  <td className="clients-table__align-right clients-table__muted">
                    {client.lastActivity}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="clients-table__empty">
                  No clients match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        <footer className="clients-table__footer">
          Showing {filteredClients.length} of {CLIENTS.length} clients
        </footer>
      </div>
    </div>
  )
}
