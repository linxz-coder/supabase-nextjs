import { useEffect, useState, useRef } from 'react';
import { run } from '../utils/supabase';

export default function Home() {
  const [displayedText, setDisplayedText] = useState('');
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      console.log("useEffect triggered on update");
      async function fetchData() {
        await run((chunk) => {
          setDisplayedText(prev => prev + chunk);
        });
      }
      fetchData();
    } else {
      mounted.current = true;
    }
  }, []); 

  return (
    <>
      <h1>欢迎</h1>
      <h1>{displayedText}</h1>
    </>
  );
}
