import {
  Button,
  Radio,
  Snackbar,
  makeStyles,
  useTheme,
} from "@material-ui/core";
import type { SnackbarProps } from "@material-ui/core";
import { Alert, AlertTitle } from "@material-ui/lab";
import type { AlertProps, AlertTitleProps } from "@material-ui/lab";
import equal from "fast-deep-equal";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import { ArcherContainer, ArcherElement } from "react-archer";
import type { ArcherContainerProps } from "react-archer";
import * as Sentry from "@sentry/browser";
import { v4 as uuidv4 } from "uuid";
import { ComponentActions } from "./ComponentActions";
import { ComponentContainer } from "./ComponentContainer";
import type { ComponentContainerProps } from "./ComponentContainer";
import type { Player } from "./Player";
import { Sidebar } from "./Sidebar";
import { SketchInputContainer } from "./SketchInputContainer";
import { TopBar } from "./TopBar";
import {
  componentInputMaxLength,
  componentName,
  componentType,
} from "./component";
import { serializeDestination } from "./destination";
import type { Destination } from "./destination";
import { initialSketch } from "./sketch";
import type { Sketch } from "./sketch";

interface AlertData {
  isOpen?: SnackbarProps["open"];
  severity?: AlertProps["severity"];
  title?: AlertTitleProps["children"];
  description?: AlertProps["children"];
}

const sketchOutputDestination: Destination = {
  type: "sketchOutput",
};

const svgContainerStyle: ArcherContainerProps["svgContainerStyle"] = {
  // To display arrows in front of components.
  zIndex: 1,
};

const sketchHeight = 1080;
const sketchWidth = 1920;

const useStyles = makeStyles(({ mixins, palette, spacing }) => ({
  archerContainer: {
    position: "relative",
    height: sketchHeight,
    width: sketchWidth,
  },
  container: {
    display: "flex",
  },
  input: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly",
    position: "absolute",
    bottom: 0,
    right: "calc(100% - 10px)",
    top: 0,
  },
  main: {
    flexGrow: 1,
    backgroundColor: palette.background.default,
    padding: spacing(3),
  },
  output: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translate(25%, -50%)",
    backgroundColor: palette.background.paper,
    padding: 0,
    width: 20,
  },
  sketch: {
    position: "relative",
    border: `1px solid ${palette.divider}`,
    marginLeft: spacing(20),
  },
  toolbar: mixins.toolbar,
}));

const App: FunctionComponent = memo(() => {
  const [alertData, dispatchAlertData] = useState<AlertData>({});
  const [errorComponentIDs, dispatchErrorComponentIDs] = useState<string[]>([]);
  const [isSidebarOpen, dispatchIsSidebarOpen] = useState(false);
  const [player, dispatchPlayer] = useState<Player>();

  const [sketch, dispatchSketch] = useState(() => {
    const sketchItem = localStorage.getItem("sketch");

    return sketchItem ? (JSON.parse(sketchItem) as Sketch) : initialSketch;
  });

  useEffect(() => {
    try {
      localStorage.setItem("sketch", JSON.stringify(sketch));
    } catch (exception: unknown) {
      dispatchAlertData({
        isOpen: true,
        severity: "error",
        title: "Failed to save the sketch to localStorage",
        description: "Please save the sketch as a file.",
      });

      if (
        !(exception instanceof DOMException) ||
        exception.code !== DOMException.QUOTA_EXCEEDED_ERR
      ) {
        console.error(exception);
        Sentry.captureException(exception);
      }
    }
  }, [sketch]);

  const archerContainerElement = useRef<ArcherContainer>(null);

  const classes = useStyles();
  const theme = useTheme();

  const dispatchComponent: Dispatch<SetStateAction<Sketch["component"]>> = (
    action
  ) =>
    dispatchSketch((prevSketch) => ({
      ...prevSketch,
      component:
        typeof action === "function" ? action(prevSketch.component) : action,
    }));

  const dispatchInputs: Dispatch<SetStateAction<Sketch["inputs"]>> = (action) =>
    dispatchSketch((prevSketch) => ({
      ...prevSketch,
      inputs: typeof action === "function" ? action(prevSketch.inputs) : action,
    }));

  useEffect(() => {
    if (!player) {
      return;
    }

    const handleBufferButtonClick = () => {
      dispatchAlertData((prevAlertData) => ({
        ...prevAlertData,
        isOpen: false,
      }));

      dispatchSketch((prevSketch) => ({
        ...prevSketch,
        component: {
          ...prevSketch.component,
          [uuidv4()]: {
            name: componentName[componentType.buffer],
            type: componentType.buffer,
            outputDestinations: [],
            position: { x: window.scrollX, y: window.scrollY },
            extendedData: {},
          },
        },
      }));
    };

    player.setCoreInfiniteLoopDetectedHandler(({ componentID }) => {
      dispatchAlertData({
        isOpen: true,
        severity: "error",
        title: "Infinite loop detected",
        description: (
          <>
            Please clear the infinite loop.&nbsp;
            <Button
              variant="outlined"
              size="small"
              onClick={handleBufferButtonClick}
            >
              buffer
            </Button>
            &nbsp;component may help to fix it.
          </>
        ),
      });

      dispatchErrorComponentIDs([componentID]);
      dispatchPlayer(undefined);

      void player.close();
    });

    return () => player.setCoreInfiniteLoopDetectedHandler(undefined);
  }, [player]);

  const handleDistributorButtonClick = useCallback(
    () =>
      dispatchSketch((prevSketch) => ({
        ...prevSketch,
        component: {
          ...prevSketch.component,
          [uuidv4()]: {
            name: componentName[componentType.distributor],
            type: componentType.distributor,
            outputDestinations: [],
            position: { x: window.scrollX, y: window.scrollY },
            extendedData: {},
          },
        },
      })),
    []
  );

  const handleDrag = useCallback(() => {
    if (!archerContainerElement.current) {
      throw new Error();
    }

    archerContainerElement.current.refreshScreen();
  }, []);

  const removeConnections = useCallback(
    (targets: Destination[]) =>
      dispatchSketch((prevSketch) => {
        const component: Sketch["component"] = Object.fromEntries(
          Object.entries(prevSketch.component).map(([id, component]) => [
            id,
            {
              ...component,
              outputDestinations: component.outputDestinations.filter(
                (outputDestination) =>
                  targets.every((target) => !equal(outputDestination, target))
              ),
            },
          ])
        );

        return {
          ...prevSketch,
          component,
          inputs: prevSketch.inputs.map((prevInput) => ({
            ...prevInput,
            destination: targets.some((target) =>
              equal(prevInput.destination, target)
            )
              ? undefined
              : prevInput.destination,
          })),
        };
      }),
    []
  );

  const handleRemoveComponentRequest: NonNullable<
    ComponentContainerProps["onRemoveComponentRequest"]
  > = useCallback(
    (event) => {
      removeConnections(
        [...Array(componentInputMaxLength).keys()].map((index) => ({
          type: "component",
          id: event.id,
          inputIndex: index,
        }))
      );

      dispatchSketch((prevSketch) => ({
        ...prevSketch,
        component: Object.fromEntries(
          Object.entries(prevSketch.component).flatMap(([id, component]) =>
            id === event.id ? [] : [[id, component]]
          )
        ),
      }));
    },
    [removeConnections]
  );

  const handleAlertClose = useCallback(
    () =>
      dispatchAlertData((prevAlertData) => ({
        ...prevAlertData,
        isOpen: false,
      })),
    []
  );

  const handleOutputClick = useCallback(
    () => removeConnections([sketchOutputDestination]),
    [removeConnections]
  );

  const isOutputConnected =
    Object.values(sketch.component).some((otherComponent) =>
      otherComponent.outputDestinations.some((outputDestination) =>
        equal(outputDestination, sketchOutputDestination)
      )
    ) ||
    sketch.inputs.some((input) =>
      equal(input.destination, sketchOutputDestination)
    );

  return (
    <div className={classes.container}>
      <TopBar
        dispatchErrorComponentIDs={dispatchErrorComponentIDs}
        dispatchIsSidebarOpen={dispatchIsSidebarOpen}
        dispatchPlayer={dispatchPlayer}
        dispatchSketch={dispatchSketch}
        player={player}
        sketch={sketch}
        onDrag={handleDrag}
      />

      <Sidebar
        dispatchIsSidebarOpen={dispatchIsSidebarOpen}
        dispatchSketch={dispatchSketch}
        isSidebarOpen={isSidebarOpen}
      />

      <main className={classes.main}>
        <div className={classes.toolbar} />

        <div className={classes.sketch}>
          <ArcherContainer
            className={classes.archerContainer}
            ref={archerContainerElement}
            strokeColor={theme.palette.divider}
            svgContainerStyle={svgContainerStyle}
          >
            {Object.entries(sketch.component).map(([id, component]) => (
              <ComponentContainer
                id={id}
                key={id}
                component={component}
                sketch={sketch}
                dispatchAlertData={dispatchAlertData}
                dispatchComponent={dispatchComponent}
                isError={errorComponentIDs.includes(id)}
                onDistributorButtonClick={handleDistributorButtonClick}
                onDrag={handleDrag}
                onRemoveComponentRequest={handleRemoveComponentRequest}
                onRemoveConnectionsRequest={removeConnections}
              >
                <ComponentActions
                  id={id}
                  component={component}
                  dispatchComponent={dispatchComponent}
                  player={player}
                />
              </ComponentContainer>
            ))}

            <div className={classes.input}>
              {sketch.inputs.map((input, index) => (
                <SketchInputContainer
                  key={index}
                  index={index}
                  dispatchInputs={dispatchInputs}
                  input={input}
                  onDrag={handleDrag}
                  onRemoveConnectionsRequest={removeConnections}
                />
              ))}
            </div>

            <div className={classes.output}>
              <ArcherElement
                id={serializeDestination({
                  destination: sketchOutputDestination,
                })}
              >
                <Radio
                  data-sketch-output
                  checked={isOutputConnected}
                  className={classes.output}
                  size="small"
                  onClick={handleOutputClick}
                />
              </ArcherElement>
            </div>
          </ArcherContainer>
        </div>
      </main>

      <Snackbar open={alertData.isOpen}>
        <Alert severity={alertData.severity} onClose={handleAlertClose}>
          <AlertTitle>{alertData.title}</AlertTitle>
          {alertData.description}
        </Alert>
      </Snackbar>
    </div>
  );
});

export { App, sketchHeight, sketchOutputDestination, sketchWidth };
export type { AlertData };
