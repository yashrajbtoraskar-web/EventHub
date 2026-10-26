import { Search, X, ArrowUpDown } from 'lucide-react';
import { CATEGORIES } from '../utils/validators.js';

export default function EventFilters({ search, onSearch, category, onCategory, sort, onSort }) {
  return (
    <section className="filters" aria-label="Search and filter events">
      <div className="search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search events by name…"
          aria-label="Search events by name"
        />
        {search && (
          <button className="icon-btn icon-btn--plain" onClick={() => onSearch('')} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="filters__row">
        <div className="chips" role="group" aria-label="Filter by category">
          {['All', ...CATEGORIES].map((c) => (
            <button
              key={c}
              className={`chip ${category === c ? 'chip--active' : ''}`}
              onClick={() => onCategory(c)}
              aria-pressed={category === c}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="sort">
          <ArrowUpDown size={16} aria-hidden="true" />
          <span className="sr-only">Sort by date</span>
          <select value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Sort by date">
            <option value="asc">Date: earliest first</option>
            <option value="desc">Date: latest first</option>
          </select>
        </label>
      </div>
    </section>
  );
}
