"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPatients } from "@/services/patient.service";
import { Patient } from "@/interfaces/patient";

export function PatientSearchSelect({
  value,
  onChange,
  placeholder = "Chọn bệnh nhân",
}: {
  value?: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      const res = await getPatients({ search, page: 0, size: 20 });
      setPatients(res.content || res?.data?.data?.content || []);
    };
    fetchPatients();
  }, [search]);

  const selected = patients.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          {selected ? selected.fullName : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Tìm bệnh nhân..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Không tìm thấy</CommandEmpty>
            <CommandGroup>
              <CommandItem
                key="none"
                value="none"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                <span className="text-muted-foreground text-sm">Bỏ chọn</span>
              </CommandItem>
              {patients.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.id}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === p.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{p.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.phoneNumber} {p.bloodType ? `• ${p.bloodType}` : ""}
                      </p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
