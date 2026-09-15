import { Link } from 'react-router-dom';
import { formatCurrency, formatNumber } from '../utils/format';
import { coverFor } from '../utils/images';
import { PinIcon, StarIcon } from './Icons';

export default function HallCard({ hall, location }) {
  const rating = hall.averageRating != null ? Number(hall.averageRating) : null;

  return (
    <article className="card">
      <Link to={`/halls/${hall.id}`} className="card__media" aria-label={hall.name}>
        <img src={coverFor(hall, 900)} alt={hall.name} loading="lazy" />
      </Link>

      <div className="hall-card__body">
        <div className="hall-card__top">
          <h3 className="hall-card__title">
            <Link to={`/halls/${hall.id}`}>{hall.name}</Link>
          </h3>
          {rating != null && rating > 0 && (
            <span className="badge badge--gold">
              <StarIcon /> {rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="hall-card__meta">
          <PinIcon style={{ verticalAlign: -2, marginRight: 4 }} />
          {hall.hotelName}
          {location ? ` · ${location}` : ''}
        </p>

        <div className="chip-row">
          <span className="badge badge--neutral">Up to {formatNumber(hall.capacity)} guests</span>
          {hall.decorationTheme && (
            <span className="badge badge--neutral">{hall.decorationTheme}</span>
          )}
        </div>

        <div className="hall-card__foot">
          <span className="hall-card__price">
            {formatCurrency(hall.price)}
            <small>Starting price</small>
          </span>
          <Link to={`/halls/${hall.id}`} className="link-gold">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
