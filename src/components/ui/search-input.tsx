import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          {...props}
          ref={ref}
          className={cn("pl-9", className)}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput } 