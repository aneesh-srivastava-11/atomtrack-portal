"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function UsersPage() {
  const [users, setUsers] = useState<Array<User & { manager?: User }>>([]);
  useEffect(() => { api.get("/api/admin/users").then(({ data }) => setUsers(data)); }, []);
  return (
    <Card>
      <CardHeader><CardTitle>User hierarchy</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Manager</TableHead></TableRow></TableHeader>
          <TableBody>{users.map((user) => <TableRow key={user.id}><TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.role}</TableCell><TableCell>{user.manager?.name || ""}</TableCell></TableRow>)}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
