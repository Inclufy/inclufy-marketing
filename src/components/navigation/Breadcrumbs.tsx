// src/components/navigation/Breadcrumbs.tsx
export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  
  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
        <Home className="w-4 h-4" />
      </Link>
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join('/')}`;
        const label = segment.split('-').map(s => 
          s.charAt(0).toUpperCase() + s.slice(1)
        ).join(' ');
        
        return (
          <Fragment key={path}>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link 
              to={path} 
              className="text-gray-600 hover:text-gray-900"
            >
              {label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}