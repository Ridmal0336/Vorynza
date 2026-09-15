import { useEffect, useMemo, useState } from 'react';

export function AdminHeader({ title, description, action }) {
  return (
    <div className="page-head">
      <div className="page-head__text">
        <p className="eyebrow">Admin</p>
        <h1>{title}</h1>
        {description && <p className="lead">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Client-side search + pagination for the admin tables. The API returns full
 * collections, so filtering and paging happen here.
 */
export function useTableView(items, searchFields, pageSize = 10) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // Callers pass an inline array, so compare by contents rather than identity.
  const fieldKey = searchFields.join(',');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    const fields = fieldKey.split(',');
    return items.filter((item) =>
      fields.some((field) =>
        String(item[field] ?? '')
          .toLowerCase()
          .includes(term)
      )
    );
  }, [items, query, fieldKey]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [page, pageCount]);

  const visible = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  return { query, setQuery, page, setPage, visible, pageCount, total: filtered.length };
}

export function TableToolbar({ query, onQueryChange, placeholder, children }) {
  return (
    <div className="table-toolbar">
      <div className="table-search" style={{ flex: 1, minWidth: 220 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder || 'Search…'}
          aria-label="Search records"
        />
      </div>
      {children}
    </div>
  );
}

export function YesNo({ value }) {
  return <span className={`badge badge--${value ? 'confirmed' : 'muted'}`}>{value ? 'Yes' : 'No'}</span>;
}
