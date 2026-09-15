export default function Pagination({ page, pageCount, total, onChange }) {
  if (pageCount <= 1) return null;

  return (
    <div className="pagination">
      <span>
        Page {page} of {pageCount}
        {total != null ? ` · ${total} records` : ''}
      </span>
      <button
        type="button"
        className="btn btn--quiet btn--sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      <button
        type="button"
        className="btn btn--quiet btn--sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
      >
        Next
      </button>
    </div>
  );
}
