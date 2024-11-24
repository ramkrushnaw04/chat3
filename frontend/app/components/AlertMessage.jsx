import React from 'react';

const AlertMessage = ({ text }) => {
  return (
    <div className='w-full'>
    <p className='m-auto w-fit py-2 px-3 my-5 text-xs text-black bg-gray-100 text-center rounded-full dark:text-white dark:bg-gray-800'>
      {text}
    </p>
  </div>
  
  );
};

export default AlertMessage;
