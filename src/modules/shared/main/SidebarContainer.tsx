import {Box, Stack} from "@mui/material";
import {ReactNode} from "react";

interface SidebarContainerProps {
    children: ReactNode;
}

const SidebarContainer = ({children}: SidebarContainerProps) => (
    <Box
        sx={{
            width: 270,
            height: "100vh",
            bgcolor: "linear-gradient(180deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: 6,
        }}
    >
        <Stack sx={{height: "100%"}}>{children}</Stack>
    </Box>
);

export default SidebarContainer;
