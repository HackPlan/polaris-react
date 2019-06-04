import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  addEventListener,
  removeEventListener,
} from '@shopify/javascript-utilities/events';
import {classNames} from '@shopify/css-utilities';

import styles from './Collapsible.scss';

export interface Props {
  /** Assign a unique ID to the collapsible. For accessibility, pass this ID as the value of the triggering component’s aria-controls prop. */
  id: string;
  /** Toggle whether the collapsible is expanded or not. */
  open: boolean;
  /** The content to display inside the collapsible. */
  children?: React.ReactNode;
}

export interface State {
  height?: number | null;
}

export function Collapsible({id, open, children}: Props) {
  const [height, setHeight] = useState<number>(0);

  const containerNode = useRef<HTMLDivElement>(null);
  const contentNode = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentNode.current) return;
    console.log('Called once');
    setHeight(contentNode.current.offsetHeight);
  }, []);

  const handleResize = useCallback(() => {
    if (!contentNode.current) return;
    setHeight(contentNode.current.offsetHeight);
  }, []);

  useEventListener(window, 'resize', handleResize);

  useEffect(
    () => {
      if (!height) return;
      if (!containerNode.current) return;
      const style = document.createElement('style');
      const keyframeAnimation = createKeyframeAnimation(height);
      style.textContent = keyframeAnimation;
      document.head.appendChild(style);
    },
    [height],
  );

  const wrapperClassName = classNames(
    styles.Collapsible,
    open && styles.CollapsibleContainerExpanded,
    !open && styles.CollapsibleContainerCollapsed,
  );

  const contentClassName = classNames(
    styles.Collapsible,
    open && styles.CollapsibleContentExpanded,
    !open && styles.CollapsibleContentCollapsed,
  );

  const containerStyles = {
    animationName: open
      ? 'collapsibleContainerAnimation'
      : 'collapsibleContentAnimation',
    // CollapsibleContainerCollapsed: {
    //   animationName: 'collapsibleContentAnimation',
    // },
    // CollapsibleContentCollapsed: {
    //   animationName: 'collapsibleContainerAnimation',
    // },
  };

  const contentStyles = {
    animationName: open
      ? 'collapsibleContentAnimation'
      : 'collapsibleContainerAnimation',
  };

  return (
    <div
      id={id}
      aria-hidden={!open}
      style={containerStyles}
      className={wrapperClassName}
      ref={containerNode}
    >
      <div ref={contentNode} style={contentStyles} className={contentClassName}>
        {children}
      </div>
    </div>
  );
}

export default Collapsible;

type Node = HTMLElement | Document | Window | null;

function useEventListener(
  node: Node,
  event: string,
  handler: (event: Event) => void,
  capture = false,
  passive = false,
) {
  useEffect(
    () => {
      if (!node) return;
      addEventListener(node, event, handler, {capture, passive});
      return () => {
        if (!node) return;
        removeEventListener(node, event, handler, capture);
      };
    },
    [capture, event, handler, node, passive],
  );
}

function ease(height: number, pow = 4) {
  return 1 - Math.pow(1 - height, pow);
}

// Figure out the size of the element when collapsed.
function createKeyframeAnimation(height: number) {
  const heightScale = 0 / height;
  let animation = '';
  let inverseAnimation = '';

  for (let step = 0; step <= 100; step++) {
    // Remap the step value to an eased one.
    const easedStep = ease(step / 100);

    // Calculate the scale of the element.
    const yScale = heightScale + (1 - heightScale) * easedStep;

    animation += `${step}% {
      transform: scaleY(${yScale});
    }`;

    // And now the inverse for the contents.
    const invYScale = 1 / yScale;
    inverseAnimation += `${step}% {
      transform: scaleY(${invYScale});
    }`;
  }

  return `
  @keyframes collapsibleContainerAnimation {
    ${animation}
  }

  @keyframes collapsibleContentAnimation {
    ${inverseAnimation}
  }`;
}
