import React from 'react';
import ShiftBoard from '@/components/ShiftBoard';

const ShiftManagementPage = () => {
    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Operation Continuity</h1>
                <p className="text-muted-foreground">Manage shifts and ensure coverage.</p>
            </div>
            <ShiftBoard />
        </div>
    );
};

export default ShiftManagementPage;
