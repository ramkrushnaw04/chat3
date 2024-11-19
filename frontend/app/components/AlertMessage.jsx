import React from 'react';

const AlertMessage = ({ text }) => {
  return (
    <div className='w-full'>
      <p className='m-auto w-fit py-2 px-3 bg-gray-100 my-5 text-black text-center text-xs rounded-full'>{text}</p>
    </div>
  );
};

export default AlertMessage;
