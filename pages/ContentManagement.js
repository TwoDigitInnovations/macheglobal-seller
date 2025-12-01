import React, { useContext, useEffect, useState } from 'react'
import dynamic from 'next/dynamic';
import { Api } from '@/services/service';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { userContext } from './_app';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const config = {
  height: 500,
  toolbarAdaptive: false,
  toolbarSticky: true,
  toolbarButtonSize: "middle",
  buttons: [
    "bold", "italic", "underline", "strikethrough", "|",
    "fontsize", "font", "paragraph", "brush", "|",
    "left", "center", "right", "justify", "|",
    "ul", "ol", "indent", "outdent", "|",
    "link", "image", "video", "table", "hr", "emoji", "|",
    "undo", "redo", "|",
    "cut", "copy", "paste", "|",
    "brush", "background", "|",
    "source", "fullsize"
  ],
  uploader: {
    insertImageAsBase64URI: true,
  },
  removeButtons: ["about"],
};

function ContentManagement(props) {
  const [contentData, setContentData] = useState({
    policy: '',
    id: ''
  });

  const [user] = useContext(userContext);
  const router = useRouter();

  useEffect(() => {
    getContent();
  }, []);

  const getContent = () => {
    props.loader(true);
    Api("get", "user/getContent", router).then(
      (res) => {
        props.loader(false);
        if (res?.status && res?.data[0]) {
          const data = res.data[0];
          setContentData({
            policy: data.policy || '',
            id: data._id || ''
          });
        } else {
           toast.error(res?.data?.message);
        }
      },
      (err) => {
        props.loader(false);
        toast.error(err?.data?.message);
      }
    );
  };

  const updateContent = (field, apiField, confirmText) => {
    Swal.fire({
      title: "Are you sure?",
      text: confirmText,
      showCancelButton: true,
      confirmButtonColor: "#FF700099",
      cancelButtonColor: "#FF700099",
      confirmButtonText: "Yes, update it!"
    }).then((result) => {
      if (result.isConfirmed) {
        props.loader(true);
        const payload = {
          [apiField]: contentData[field],
          id: contentData.id
        };

        Api("post", "user/createContent", payload, router).then(
          (res) => {
            props.loader(false);
            toast.success("Updated successfully");
          },
          (err) => {
            props.loader(false);
            toast.error(err?.data?.message);
          }
        );
      }
    });
  };

  const handleContentChange = (field, value) => {
    setContentData(prev => ({ ...prev, [field]: value }));
  };

  const policyConfigs = [
    {
      title: "Policy",
      field: "policy",
      apiField: "policy",
      confirmText: "You want to update Policy!"
    },
  ];

  return (
    <div className="w-full mx-auto p-4 bg-gray-50 py-2">
      <div className="max-h-[92vh] h-full overflow-y-scroll  scrollbar-hide overflow-scroll pb-20 ">
        <div className="rounded-xl mb-2">
          <div className="flex items-center">
            <button
              className="py-2 text-[32px] text-black px-2 rounded-lg transition-all duration-300 font-medium "
            >
              Our Content
            </button>
          </div>

        </div>
        {policyConfigs.map((config, index) => (
          <PolicySection
            key={config.field}
            title={config.title}
            value={contentData[config.field]}
            onChange={(newContent) => handleContentChange(config.field, newContent)}
            onSubmit={() => updateContent(config.field, config.apiField, config.confirmText)}
            isLast={index === policyConfigs.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

const PolicySection = ({ title, value, onChange, onSubmit, isLast = false }) => {
  return (
    <div className={`mb-${isLast ? '20' : '8'}`}>
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-5 border-b border-gray-100 mb-2">
          <h3 className="text-xl text-black md:text-2xl font-normal flex items-center">
            {title}
          </h3>
        </div>

        <div className="px-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="p-1 text-black">
              <JoditEditor
                className="editor text-black"
                rows={8}
                value={value}
                onChange={onChange}
                config={config}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={onSubmit}
              className="flex items-center gap-2 bg-custom-orange text-black mb-4 font-medium py-2 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;