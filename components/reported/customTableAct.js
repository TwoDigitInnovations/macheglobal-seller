import React from "react";


export function indexID({ row }) {
  return (
    <div>
      <p className="ps-4">{parseInt(row.id) + 1}</p>
    </div>
  );
}

export function AvatarCell({ value, column, row }) {
  return (
    <div className="flex items-center">
      <div className="ml-4">
        <div className="text-sm font-medium text-white">{value}</div>
      </div>
    </div>
  );
}



