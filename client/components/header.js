import Link from 'next/link';

export default ({ currentUser }) => {

  const links = [
    !currentUser && { label: 'Sign Up',  href: '/auth/signup'},
    !currentUser && { label: 'Sign In',  href: '/auth/signin'},
    currentUser && { label: 'Create Ticket', href: '/tickets/new'},
    currentUser && { label: 'My Orders', href: '/orders'},
    currentUser  && { label: 'Sign Out', href: '/auth/signout'}
  ]
  .filter(linkConfig => linkConfig)             // filter out the falsey entries
  .map( ({label, href}) => {                    // create the JSX for each entry
    return (
      <li key={href} className="nav-item">
        <Link href={href} className="nav-link">
          {label}
        </Link>
      </li>
    )
  });

  return (
    <nav className="navbar navbar-light bg-light">
      <Link className="navbar-brand" href="/">
        TODO Tix
      </Link>

      <div className="d-flex justify-content-end">
        <ul className="nav d-flex align-items-center">
          {links}
        </ul>
      </div>
    </nav>
  );
};
