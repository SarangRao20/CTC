import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { Loader2 } from 'lucide-react';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
}

import { useApp } from '@/context/AppContext';

const AddTaskModal: React.FC<AddTaskModalProps> = ({
    isOpen,
    onClose,
    patientId,
    patientName,
}) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { refreshData } = useApp();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'medication',
        priority: 'medium',
        dueTime: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast({
                title: t('error'),
                description: t('enter_title'),
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/tasks', {
                pwid_id: parseInt(patientId),
                title: formData.title,
                description: formData.description,
                category: formData.category,
                priority: formData.priority,
                due_time: formData.dueTime || null,
                status: 'pending',
            });

            toast({
                title: t('success'),
                description: `${t('task_created')} ${patientName}`,
            });

            // Reset form
            setFormData({
                title: '',
                description: '',
                category: 'medication',
                priority: 'medium',
                dueTime: '',
            });

            await refreshData();
            onClose();
        } catch (error) {
            toast({
                title: t('error'),
                description: t('failed_create_task'),
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('add_task')} - {patientName}</DialogTitle>
                    <DialogDescription>
                        {t('add_task_desc')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">{t('task_title')} *</Label>
                        <Input
                            id="title"
                            placeholder={t('task_placeholder')}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">{t('description')}</Label>
                        <Textarea
                            id="description"
                            placeholder={t('desc_placeholder')}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">{t('category')}</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="medication">{t('medication')}</SelectItem>
                                    <SelectItem value="therapy">{t('therapy')}</SelectItem>
                                    <SelectItem value="hygiene">{t('hygiene')}</SelectItem>
                                    <SelectItem value="meals">{t('meals')}</SelectItem>
                                    <SelectItem value="activity">{t('activity')}</SelectItem>
                                    <SelectItem value="other">{t('other')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">{t('priority')}</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                            >
                                <SelectTrigger id="priority">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">{t('low')}</SelectItem>
                                    <SelectItem value="medium">{t('medium')}</SelectItem>
                                    <SelectItem value="high">{t('high')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dueTime">{t('due_time')}</Label>
                        <Input
                            id="dueTime"
                            type="time"
                            value={formData.dueTime}
                            onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                            {t('cancel')}
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('creating')}
                                </>
                            ) : (
                                t('create_task')
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddTaskModal;
