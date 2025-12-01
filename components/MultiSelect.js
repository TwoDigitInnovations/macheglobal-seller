import React from "react";
import { Menu, MenuItem, Checkbox, ListItemText } from "@mui/material";

const MultiSelect = ({
  anchorEl,
  open,
  handleCloseMenu,
  options,
  selectedOptions,
  setSelectedOptions,
  onClick,
}) => {
  const handleToggle = (option) => {
    const currentIndex = selectedOptions.indexOf(option);
    const newSelected = [...selectedOptions];

    if (currentIndex === -1) {
      newSelected.push(option);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    setSelectedOptions(newSelected);
  };

  return (
    <Menu
      id="lock-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleCloseMenu}
      MenuListProps={{
        "aria-labelledby": "lock-button",
        role: "listbox",
      }}
      sx={{padding: 0}}
    >
      {options.map((option) => (
        <div
          className="flex items-center cursor-pointer hover:bg-slate-100 w-[130px]"
          key={option}
          onClick={() => handleToggle(option)}
        >
          <Checkbox
            size="small"
            color="secondary"
            checked={selectedOptions.indexOf(option) > -1}
          />
          <span className="text-sm text-custom-darkpurple cursor-pointer">
            {option}
          </span>
        </div>
      ))}
      <button
        className="text-white bg-custom-darkpurple w-full h-[30px] mt-2"
        onClick={onClick}
      >
        Export
      </button>
    </Menu>
  );
};

export default MultiSelect;
