type AlertTableProps = {
    message: string;
    insideTable?: boolean;
};

export const AlertTable = ({ message, insideTable = false }: AlertTableProps) => {
    const content = (
        <div className="card p-6 my-4 bg-blue-50 border border-blue-300 rounded-lg">
            <div className="flex items-center text-blue-800">
                <i className="fa fa-info-circle mr-2 text-lg" aria-hidden="true"></i>
                <span className="text-md font-medium">{message}</span>
            </div>
        </div>
    );

    return insideTable ? (
        <tbody>
        <tr>
            <td colSpan={999}>{content}</td>
        </tr>
        </tbody>
    ) : (
        content
    );
};
