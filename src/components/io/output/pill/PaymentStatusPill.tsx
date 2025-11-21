import {PaymentStatus, PaymentStatusLabel} from "../../../../domain/model/payment/Payment";

export const PaymentStatusPill = ({status}: { status: PaymentStatus }) => {

    switch (status) {

        case PaymentStatus.PAID: {
            return (
                <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 me-1"/>
                    {PaymentStatusLabel[status]}
                </div>
            );
        }

        case PaymentStatus.CANCELLED: {
            return (
                <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 me-1"/>
                    {PaymentStatusLabel[status]}
                </div>
            );
        }

        default:
            return (
                <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-500 me-1"/>
                    {status}
                </div>
            );
    }
};
