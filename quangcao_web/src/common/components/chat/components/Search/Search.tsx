import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';

const Search = styled("div")(({ theme }) => ({
    position: "relative",
    borderRadius: 20,
    backgroundColor: alpha(theme.palette.background.default, 1),
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "100%"
  })) as React.FC<React.HTMLAttributes<HTMLDivElement>>;

  export default Search