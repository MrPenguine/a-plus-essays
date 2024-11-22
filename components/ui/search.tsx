"use client"

import { Search as SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Search({ className, ...props }: SearchProps) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      <Input
        {...props}
        className={`pl-10 ${className}`}
      />
    </div>
  );
} 