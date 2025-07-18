import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, MoreHorizontal, Plus, ChevronDown, Phone, Mail } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  tags?: string[];
  created: string;
  lastSeen: string;
}

const mockClients: Client[] = [
  {
    id: "1",
    name: "Arketa Tester",
    email: "instructors+apple@arketa.co",
    created: "Jul 8, 2025",
    lastSeen: "--"
  },
  {
    id: "2",
    name: "Angela Bazigos",
    email: "abazigos@touchstonetsv.com",
    created: "Jul 1, 2025",
    lastSeen: "Jul 14, 2025"
  },
  {
    id: "3",
    name: "Leah Thomas",
    email: "leahraethomas@gmail.com",
    created: "Jul 1, 2025",
    lastSeen: "Jul 14, 2025"
  },
  {
    id: "4",
    name: "Tracy Navichoque",
    email: "tnavichoque@gmail.com",
    created: "Jun 26, 2025",
    lastSeen: "Jul 16, 2025"
  },
  {
    id: "5",
    name: "Holly Aronhalt",
    email: "haronhalt@gmail.com",
    created: "Jun 23, 2025",
    lastSeen: "Jul 16, 2025"
  },
  {
    id: "6",
    name: "Lara Townsend",
    email: "larablueskies@gmail.com",
    created: "Jun 2, 2025",
    lastSeen: "Jul 15, 2025"
  },
  {
    id: "7",
    name: "Jonatan Littke",
    email: "jonatan.littke@gmail.com",
    created: "May 14, 2025",
    lastSeen: "Jun 29, 2025"
  },
  {
    id: "8",
    name: "Monika Mercea",
    email: "monmer007@gmail.com",
    created: "Apr 15, 2025",
    lastSeen: "Jun 10, 2025"
  },
  {
    id: "9",
    name: "Jodie Ortiz",
    email: "lil.jortiz0922@gmail.com",
    tags: ["Classpass"],
    created: "Jul 17, 2025",
    lastSeen: "Jul 17, 2025"
  },
  {
    id: "10",
    name: "Erin Daly",
    email: "nire1of6@gmail.com",
    tags: ["Classpass"],
    created: "Jul 17, 2025",
    lastSeen: "Jul 17, 2025"
  },
  {
    id: "11",
    name: "Lindsey Collison",
    email: "lindseyt97@gmail.com",
    created: "Jul 16, 2025",
    lastSeen: "Jul 16, 2025"
  },
  {
    id: "12",
    name: "Lisa Brigandi",
    email: "lisa.brigandi13@gmail.com",
    created: "Jul 16, 2025",
    lastSeen: "Jul 16, 2025"
  },
  {
    id: "13",
    name: "Lexi Howe",
    email: "howelexi@yahoo.com",
    tags: ["Classpass"],
    created: "Jul 16, 2025",
    lastSeen: "Jul 16, 2025"
  }
];

const ClientsTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = [
    "All", 
    "No Purchases or Reservations", 
    "Intro Offer", 
    "Bought Membership in the last 7 days", 
    "Member", 
    "Active Member", 
    "Retention", 
    "First class booked"
  ];

  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 bg-background">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Clients</h1>
          <p className="text-muted-foreground">
            Client information may be delayed by up to one hour when using segments
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                More <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuItem>Import</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            className="bg-primary hover:bg-primary/90 gap-2"
            onClick={() => console.log("Add new client clicked")}
          >
            <Plus className="h-4 w-4" />
            Add new
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 overflow-x-auto">
        {filters.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "ghost"}
            className={`whitespace-nowrap ${
              activeFilter === filter 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all clients"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">NAME</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>TAGS</TableHead>
              <TableHead>CREATED</TableHead>
              <TableHead>LAST SEEN</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-muted-foreground">{client.email}</TableCell>
                <TableCell>
                  {client.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-talo-green-light text-talo-green-dark">
                      {tag}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell className="text-muted-foreground">{client.created}</TableCell>
                <TableCell className="text-muted-foreground">{client.lastSeen}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientsTable;