import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
    className?: string;
    variant?: "ghost" | "outline" | "default";
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className, variant = "ghost" }) => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size="icon" className={`text-muted-foreground hover:text-foreground ${className}`}>
                    <Globe className="w-5 h-5" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                    <span className={i18n.language === 'en' ? 'font-bold' : ''}>English</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('hi')}>
                    <span className={i18n.language === 'hi' ? 'font-bold' : ''}>हिंदी (Hindi)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('mr')}>
                    <span className={i18n.language === 'mr' ? 'font-bold' : ''}>मराठी (Marathi)</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default LanguageSwitcher;
