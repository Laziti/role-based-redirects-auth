import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/AdminSidebar';
import PaymentApprovalSidebar from '@/components/admin/PaymentApprovalSidebar';

const AdminPaymentsPage = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <SidebarInset>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="ml-4 text-xl font-semibold">Payment Approvals</h1>
            </div>
          </div>
          <div className="p-6">
            <PaymentApprovalSidebar />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminPaymentsPage; 