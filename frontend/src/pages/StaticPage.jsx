import { Link } from 'react-router-dom';
import { unsplash } from '../utils/images';

const CONTENT = {
  about: {
    eyebrow: 'About',
    title: 'Wedding venues, without the guesswork',
    image: 'photo-1470217957101-da7150b9b681',
    body: [
      'Vorynza is a reservation platform for wedding halls at hotels across Sri Lanka. We list real halls with real capacities and live date availability, so what you see is genuinely bookable.',
      'Every venue on Vorynza is managed together with the hotel’s banquet team. Packages, catering menus, and pricing come straight from the property — there are no hidden coordination fees layered on top.',
    ],
    points: [
      'Live availability for every hall',
      'Transparent package and catering pricing',
      'Invoices and payment history in your dashboard',
      'One coordinator from enquiry to event day',
    ],
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Talk to a wedding coordinator',
    image: 'photo-1522413452208-996ff3f3e740',
    body: [
      'Our coordinators can help you shortlist halls, hold a date, and build a catering menu around your guest count and budget.',
    ],
    details: [
      { label: 'Email', value: 'hello@vorynza.com' },
      { label: 'Phone', value: '+94 11 200 0000' },
      { label: 'Office', value: 'Colombo 03, Sri Lanka' },
      { label: 'Hours', value: 'Mon–Sat, 9.00am – 6.00pm' },
    ],
  },
};

export default function StaticPage({ page }) {
  const content = CONTENT[page];
  if (!content) return null;

  return (
    <div className="container page">
      <div className="page-head">
        <div className="page-head__text">
          <p className="eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
        </div>
      </div>

      <div className="feature-row">
        <div className="stack">
          {content.body.map((paragraph) => (
            <p className="lead" key={paragraph.slice(0, 24)}>
              {paragraph}
            </p>
          ))}

          {content.points && (
            <ul className="tick-list">
              {content.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          )}

          {content.details && (
            <div className="spec-grid">
              {content.details.map((detail) => (
                <div className="spec" key={detail.label}>
                  <span className="spec__label">{detail.label}</span>
                  <span className="spec__value" style={{ fontSize: 17 }}>
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="row" style={{ marginTop: 8 }}>
            <Link to="/halls" className="btn btn--primary">
              Find a Venue
            </Link>
            <Link to="/packages" className="btn btn--secondary">
              View packages
            </Link>
          </div>
        </div>

        <div className="feature-row__media">
          <img src={unsplash(content.image, 1000)} alt="" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
