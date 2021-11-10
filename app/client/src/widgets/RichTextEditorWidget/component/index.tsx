import React, { useEffect, useState, useRef } from "react";
import { debounce } from "lodash";
import styled from "styled-components";
import { useScript, ScriptStatus } from "utils/hooks/useScript";
import { ButtonBorderRadius, ButtonBoxShadow } from "components/constants";
import { getBorderRadiusValue, getBoxShadowValue } from "widgets/WidgetUtils";

const StyledRTEditor = styled.div<{
  borderRadius: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
}>`
  && {
    width: 100%;
    height: 100%;
    .tox .tox-editor-header {
      z-index: 0;
    }

    .tox-tinymce {
      border-radius: ${({ borderRadius }) =>
        getBorderRadiusValue(borderRadius)};
      box-shadow: ${({ boxShadow, boxShadowColor }) =>
        `${getBoxShadowValue(boxShadowColor, boxShadow)}`} !important;
    }
  }
`;

export interface RichtextEditorComponentProps {
  defaultValue?: string;
  placeholder?: string;
  widgetId: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isToolbarHidden: boolean;
  borderRadius: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  onValueChange: (valueAsString: string) => void;
}
export function RichtextEditorComponent(props: RichtextEditorComponentProps) {
  const status = useScript(
    "https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.7.0/tinymce.min.js",
  );

  const [isEditorInitialised, setIsEditorInitialised] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null as any);

  const toolbarConfig =
    "undo redo | formatselect | bold italic backcolor forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | table | help";

  /* Using editorContent as a variable to save editor content locally to verify against new content*/
  const editorContent = useRef("");
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (editorInstance !== null) {
      editorInstance.mode.set(
        props.isDisabled === true ? "readonly" : "design",
      );
    }
  }, [props.isDisabled, editorInstance, isEditorInitialised]);

  useEffect(() => {
    if (
      editorInstance !== null &&
      (editorContent.current.length === 0 ||
        editorContent.current !== props.defaultValue)
    ) {
      const content = props.defaultValue;

      editorInstance.setContent(content, {
        format: "html",
      });
    }
  }, [props.defaultValue, editorInstance, isEditorInitialised]);
  useEffect(() => {
    if (status !== ScriptStatus.READY) return;
    const onChange = debounce((content: string) => {
      editorContent.current = content;
      props.onValueChange(content);
    }, 200);

    const editorId = `rte-${props.widgetId}`;
    const selector = `textarea#${editorId}`;

    const prevEditor = (window as any).tinyMCE.get(editorId);
    if (prevEditor) {
      // following code is just a patch for tinyMCE's issue with firefox
      prevEditor.contentWindow = window;
      // removing in case it was not properly removed, which will cause problems
      prevEditor.remove();
    }

    (window as any).tinyMCE.init({
      forced_root_block: false,
      height: "100%",
      selector: selector,
      menubar: false,
      branding: false,
      resize: false,
      setup: (editor: any) => {
        editor.mode.set(props.isDisabled === true ? "readonly" : "design");
        const content = props.defaultValue;
        editor.setContent(content, { format: "html" });
        editor
          .on("Change", () => {
            onChange(editor.getContent({ format: "html" }));
          })
          .on("Undo", () => {
            onChange(editor.getContent({ format: "html" }));
          })
          .on("Redo", () => {
            onChange(editor.getContent({ format: "html" }));
          })
          .on("KeyUp", () => {
            onChange(editor.getContent({ format: "html" }));
          });
        setEditorInstance(editor);
        editor.on("init", () => {
          setIsEditorInitialised(true);
        });
      },
      plugins: [
        "advlist autolink lists link image charmap print preview anchor",
        "searchreplace visualblocks code fullscreen",
        "insertdatetime media table paste code help",
      ],
      toolbar: props.isToolbarHidden ? false : toolbarConfig,
    });

    return () => {
      (window as any).tinyMCE.EditorManager.remove(selector);
      editorInstance !== null && editorInstance.remove();
    };
  }, [status, props.isToolbarHidden]);

  if (status !== ScriptStatus.READY) return null;

  return (
    <StyledRTEditor
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      boxShadowColor={props.boxShadowColor}
    >
      <textarea id={`rte-${props.widgetId}`} />
    </StyledRTEditor>
  );
}

export default RichtextEditorComponent;
