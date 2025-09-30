import { createSlice } from "@reduxjs/toolkit";
import { dispatch } from "../store";
import type { AppDispatch } from "../../../../app/store";

// define initial state
const initialState = {
    sidebar:{
        open:false,
        type: "CONTACT",// can be CONTACT, STARRED,SHARED
    }
}

// create slice
const slice = createSlice({
    name:'app',
    initialState,
    reducers:{
        //Toggle sidebar
        toggleSidebar(state){
            state.sidebar.open = !state.sidebar.open
        },
        updateSidebarType(state, action){
            state.sidebar.type = action.payload.type;
        }
    }
});

// export reducer
export default slice.reducer;

//thunk functions - perform async operations
export function ToggleSidebar (){
    return async () =>{
        dispatch(slice.actions.toggleSidebar());
    }
}

export function UpdateSidebarType(type: string) {
  return async (dispatch: AppDispatch) => {  // hoặc Dispatch loại phù hợp
    dispatch(slice.actions.updateSidebarType({ type }));
  }
}
