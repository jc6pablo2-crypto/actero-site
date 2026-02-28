import React from "react";
import { Logos3 } from "./logos3";

const demoData = {
    heading: "Nos clients E-Commerce",
    logos: [
        {
            id: "logo-1",
            description: "Shopify",
            icon: <img src="https://logo.clearbit.com/shopify.com" alt="Shopify" className="h-8 w-auto grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all" />,
        },
        {
            id: "logo-2",
            description: "Amazon",
            icon: <img src="https://logo.clearbit.com/amazon.com" alt="Amazon" className="h-8 w-auto grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all" />,
        },
        {
            id: "logo-3",
            description: "Stripe",
            icon: <img src="https://logo.clearbit.com/stripe.com" alt="Stripe" className="h-8 w-auto grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all" />,
        },
        {
            id: "logo-4",
            description: "PayPal",
            icon: <img src="https://logo.clearbit.com/paypal.com" alt="PayPal" className="h-8 w-auto grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all" />,
        },
        {
            id: "logo-5",
            description: "Magento",
            icon: <img src="https://logo.clearbit.com/magento.com" alt="Magento" className="h-8 w-auto grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all" />,
        },
        {
            id: "logo-6",
            description: "WooCommerce",
            icon: <img src="https://logo.clearbit.com/woocommerce.com" alt="WooCommerce" className="h-8 w-auto grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all" />,
        },
        {
            id: "logo-7",
            description: "BigCommerce",
            icon: <img src="https://logo.clearbit.com/bigcommerce.com" alt="BigCommerce" className="h-8 w-auto grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all" />,
        },
        {
            id: "logo-8",
            description: "PrestaShop",
            icon: <img src="https://logo.clearbit.com/prestashop.com" alt="PrestaShop" className="h-8 w-auto grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all" />,
        },
    ],
};

function Logos3Demo() {
    return <Logos3 {...demoData} />;
}

export { Logos3Demo };
