import React, { useState } from "react";
import {
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Typography,
  Box,
  Button,
  Stack,
  Divider,
  Checkbox,
  MenuItem,
} from "@mui/material";
import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import ProductDialog from "./ProductDialogy";
import { CenterBox } from "./TitlePanel";

const ExpandButton = ({ expanded }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
    >
      <path d="M15.8351 11.6296L9.20467 5.1999C8.79094 4.79869 8 5.04189 8 5.5703L8 18.4297C8 18.9581 8.79094 19.2013 9.20467 18.8001L15.8351 12.3704C16.055 12.1573 16.0549 11.8427 15.8351 11.6296Z" fill="#9FABCB" />
    </svg>
  );
};

const TopicButton = ({ title, ...props }) => {
  const [expanded, setExpanded] = useState(true);

  const toggleExpand = () => {
    setExpanded(prev => !prev);
  };

  return (
    <Stack direction="column" alignItems="flex-start" spacing={1} mt={2}>
    <Stack direction="row">
      <MenuItem style={{color:"#ccc"}}>{title}</MenuItem>
      <Button onClick={toggleExpand} style={{color:"white", 
        position:'relative', minWidth: 'auto', left:0, padding: 0 }}>
        <ExpandButton expanded={expanded} />
      </Button>
      </Stack>
      {expanded && (
        props.children
      )}
    </Stack>
  );
};

export default function SideProductBar({data, products, setProducts}) {
    // const [categoty,setCategory] = useState(null);
    const [stateList,setStateList] = useState([]);
    // const [store, setStore] = useState(null);
    // const [parnerType,setPartnerType] = useState(null);
    // const [nearMe, setNearMe] = useState(false);

    const handleCategoryClick = (idx) => {
        console.log('Category', idx, products.length);
        setProducts(products.filter((el) => el.category === idx));
    }

    const handleViewAll = () => {
        setProducts(products);
    }

    const handleStateClick = (idx, newValue) => {
        console.log('State', idx);
        const ls = [...stateList];
        ls[idx] = newValue;
        setStateList(ls);

        const indexes = ls.map((el, i) => el ? i : -1).filter(i => i !== -1); 
        setProducts(products.filter((el) => indexes.includes(el.state)));
    }

    const handleStoreClick = (idx) => {
        console.log('Store', idx);
        setProducts(products.filter((el) => el.store === idx));
    }

    const handlePartnerTypeClick = (idx) => {
        console.log('PartnerType', idx);
        setProducts(products.filter((el) => {
            if(idx === 0 && el.isPopularPartner)
                return true;
            else if(idx === 1 && el.isFeaturedPartner)
                return true;
            else if(idx === 2)
                return true;
            else if(idx === 3 && el.isNearMe)
                return true;
        }));
    }

    return (
        <Box p={2} sx={{minWidth:320,maxWidth:320, background:"#1d609f19", 
            border:"1px solid #313131", borderRadius: 2}}>
            <CenterBox>
                <Button onClick={handleViewAll} sx={{pl:10,pr:10,borderRadius:5,border:'1px solid rgba(255,255,255,0.2)'}}>View All</Button>
            </CenterBox>
            <Stack>
                <TopicButton title="Category">
                {data.categories.map((el, idx) => 
                    (<MenuItem style={{color:"#ccc", fontWeight:300}} onClick={() => handleCategoryClick(idx)}>{el}</MenuItem>)
                )}
                </TopicButton>
            </Stack>
            
            <Divider color="#313131"/>
            <Stack>
                <TopicButton title="States">
                {data.states.map((el, idx) => 
                    <Stack direction="row">
                        <Checkbox onClick={(e)=>handleStateClick(idx, e.target.value)}/>
                        <MenuItem style={{color:"#ccc", fontWeight:300}}>{el}</MenuItem>
                    </Stack>
                )}
                </TopicButton>
            </Stack>
            <Divider color="#313131"/>
            <Stack spacing={1}>
                <TopicButton title="Stores">
                {data.stores.map((el, idx) => 
                    <Stack direction="row"  onClick={()=>handleStoreClick(idx)}>
                        <Box sx={{borderRadius:2, overflow:'hidden', height: 60, cursor:'pointer'}}>
                            <img src = {el.img} style={{position:'relative', borderRadius: 2, 
                                width: '100%', maxWidth: 'auto', height: 60}}/>
                        </Box>
                        <MenuItem  style={{color:"#ccc", fontWeight:300}}>{el.title}</MenuItem>
                    </Stack>
                )}
                </TopicButton>
            </Stack>
            <Divider color="#313131"/>
            <Stack>
                <TopicButton title="Explore">
                {["Popular Partner","FeaturedPartner","Stores","Near within 2km"].map((el, idx) => 
                    <MenuItem  style={{color:"#ccc", fontWeight:300}} onClick={()=>handlePartnerTypeClick(idx)}>{el}</MenuItem>
                )}
                </TopicButton>
            </Stack>
        </Box>
    )
}