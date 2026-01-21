import { useParams } from "react-router-dom";
import ModelEditor from "../../components/ModelEditor/ModelEditor";

const EditGLBPage = ({ previewOnly = false }) => {
  const { modelGroup, modelFile, materialIndex } = useParams();

  const modelPath = `/models/${modelGroup}/${modelFile}.glb`;
  const materialsPath = `/models/${modelGroup}/${modelFile}-materials.json`;

  return (
    <div className="edit-page">
      <ModelEditor
        modelPath={modelPath}
        materialsPath={materialsPath}
        previewOnly={previewOnly}
        selectedMaterial={
          materialIndex !== undefined ? Number(materialIndex) : null
        }
      />
    </div>
  );
};

export default EditGLBPage;
