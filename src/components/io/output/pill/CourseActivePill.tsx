export const CourseActivePill = ({active}: { active: boolean }) => {
    const color = active ? "bg-green-500" : "bg-gray-400";
    const label = active ? "Activo" : "Inactivo";
    return (
        <div className="flex items-center">
            <div className={`h-2.5 w-2.5 rounded-full ${color} me-1`}/>
            {label}
        </div>
    );
};

