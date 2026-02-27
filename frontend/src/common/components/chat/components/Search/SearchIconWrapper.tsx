import * as React from 'react';
import { styled} from '@mui/material/styles';

const SearchIconWrapper = styled("div")(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  })) as React.FC<React.HTMLAttributes<HTMLDivElement>>;

  export default SearchIconWrapper;