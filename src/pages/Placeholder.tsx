import { Construction } from 'lucide-react';

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <div className="bg-blue-50 p-4 rounded-full mb-4">
        <Construction className="h-12 w-12 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{title} Module</h2>
      <p className="text-slate-500 text-center max-w-md">
        This module is currently under construction. It will be available in the next release.
      </p>
    </div>
  );
}
