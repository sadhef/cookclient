const Table = ({ headers, children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left ${className}`}>
        <thead className="bg-white/5 border-b border-white/10">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-4 text-sm font-semibold text-white/70 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">{children}</tbody>
      </table>
    </div>
  );
};

export { Table };
