import React, { useState } from 'react';

const CreateGroup = ({ onCreate }) => {
  const [groupName, setGroupName] = useState('');

  const handleCreate = () => {
    if (!groupName.trim()) return;
    // Gọi api backend tạo group
    fetch(`${process.env.REACT_APP_API_URL}/groups`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: groupName})
    }).then(res => res.json())
      .then(data => {
        onCreate(data); // trả group mới về cập nhật UI
        setGroupName('');
      });
  };

  return (
    <div>
      <input 
        value={groupName}
        onChange={e => setGroupName(e.target.value)}
        placeholder="Group Name"
      />
      <button onClick={handleCreate}>Create Group</button>
    </div>
  );
};

export default CreateGroup;
