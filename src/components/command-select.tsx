import { Button } from "@/components/ui/button";
import { CommandEmpty, CommandInput, CommandItem, CommandList, CommandResponsiveDialog } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ChevronsUpDownIcon } from "lucide-react";
import { ReactNode, useState } from "react";

interface Props {
    options: Array<{
        id: string;
        value: string;
        children: ReactNode;
    }>;
    onSelect: (value: string) => void;
    onSearch?: (value: string) => void;
    value: string;
    placeholder?: string;
    isSearchable?: boolean;
    className?: string;


}


const CommandSelect = ({ options, onSelect, onSearch, value, placeholder = "Select an option", isSearchable, className }: Props) => {
    const [open, setOpen] = useState(false);
    const selectedOption = options.find((option) => option.value === value);

    const handleOpneChange = (open: boolean) => {
        onSearch?.("");
        setOpen(open);

    }

    return (
        <>
            <Button
                type="button"
                variant={"outline"}
                onClick={() => setOpen(true)}
                className={cn("h-9 justify-between font-normal px-2", !selectedOption && "text-muted-foreground", className)}>
                <div>{selectedOption?.children ?? placeholder}</div>
                <ChevronsUpDownIcon />


            </Button>
            <CommandResponsiveDialog shouldFilter={!onSearch} open={open} onOpenChange={handleOpneChange}>
                <CommandInput placeholder="Search..." onValueChange={onSearch} />
                <CommandList>
                    <CommandEmpty>
                        <span className="text-muted-foreground text-sm">No options found</span>
                    </CommandEmpty>
                    {options.map((option) => (
                        <CommandItem
                            key={option.id}
                            onSelect={() => {
                                onSelect(option.value);
                                setOpen(false);
                            }}
                        >
                            {option.children}
                        </CommandItem>
                    ))}
                </CommandList>
            </CommandResponsiveDialog>
        </>
    )
}

export default CommandSelect
