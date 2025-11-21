import {PaymentMethod, PaymentMethodLabel} from "../../../../domain/model/payment/Payment";

export const PaymentMethodPill = ({method}: { method: PaymentMethod }) => {

    switch (method) {

        case PaymentMethod.CASH: {
            return (
                <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 me-1"/>
                    {PaymentMethodLabel[method]}
                </div>
            );
        }

        case PaymentMethod.TRANSFER: {
            return (
                <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500 me-1"/>
                    {PaymentMethodLabel[method]}
                </div>
            );
        }

        case PaymentMethod.CARD: {
            return (
                <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 me-1"/>
                    {PaymentMethodLabel[method]}
                </div>
            );
        }

        case PaymentMethod.OTHER: {
            return (
                <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-500 me-1"/>
                    {PaymentMethodLabel[method]}
                </div>
            );
        }

        default:
            return (
                <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-500 me-1"/>
                    {method}
                </div>
            );
    }
};
